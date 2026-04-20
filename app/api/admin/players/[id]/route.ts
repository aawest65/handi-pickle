import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calcNewRating,
  toGameCategory,
  getRatingFormat,
  detectMixed,
} from "@/lib/rating/algorithm";
import { pickleballAge } from "@/lib/pickleballAge";

// PATCH /api/admin/players/[id] — update initialRating and replay history (SUPER_ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: playerId } = await params;
  const body = await req.json() as { initialRating?: number; currentRating?: number };

  // Support legacy callers that send currentRating directly (inline table edit)
  const newRating = body.initialRating ?? body.currentRating;

  if (typeof newRating !== "number" || newRating < 1.0 || newRating > 8.0) {
    return NextResponse.json({ error: "Rating must be between 1.0 and 8.0" }, { status: 400 });
  }

  const rounded = Math.round(newRating * 100) / 100;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      team1Player1Games: { orderBy: { date: "asc" } },
      team1Player2Games: { orderBy: { date: "asc" } },
      team2Player1Games: { orderBy: { date: "asc" } },
      team2Player2Games: { orderBy: { date: "asc" } },
    },
  });

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  // Collect all games this player was in, sorted chronologically
  const allGames = [
    ...player.team1Player1Games,
    ...player.team1Player2Games,
    ...player.team2Player1Games,
    ...player.team2Player2Games,
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Update initialRating (and reset currentRating to new seed before replay)
  await prisma.player.update({
    where: { id: playerId },
    data: { initialRating: rounded, currentRating: rounded },
  });

  if (allGames.length === 0) {
    // No games — just reset all ratings to the new seed
    await prisma.player.update({
      where: { id: playerId },
      data: {
        singlesRating:      rounded,
        doublesRating:      rounded,
        mixedRating:        rounded,
        singlesGamesPlayed: 0,
        doublesGamesPlayed: 0,
        mixedGamesPlayed:   0,
        gamesPlayed:        0,
      },
    });
    const updated = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, name: true, currentRating: true, initialRating: true },
    });
    return NextResponse.json(updated);
  }

  // Wipe this player's category ratings and rating history so we can replay clean
  await prisma.playerCategoryRating.deleteMany({ where: { playerId } });
  await prisma.ratingHistory.deleteMany({ where: { playerId } });
  await prisma.player.update({
    where: { id: playerId },
    data: {
      singlesRating:      rounded,
      doublesRating:      rounded,
      mixedRating:        rounded,
      singlesGamesPlayed: 0,
      doublesGamesPlayed: 0,
      mixedGamesPlayed:   0,
      gamesPlayed:        0,
    },
  });

  // Replay each game for this player only.
  // Opponents' ratings are sourced from their own RatingHistory (ratingBefore for that game),
  // which preserves the historical ratings they had when the game was originally processed.
  for (const game of allGames) {
    const fullGame = await prisma.game.findUniqueOrThrow({
      where: { id: game.id },
      include: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
        ratingHistory: true,
      },
    });

    const team1 = [fullGame.team1Player1, fullGame.team1Player2].filter(Boolean) as typeof fullGame.team1Player1[];
    const team2 = [fullGame.team2Player1, fullGame.team2Player2].filter(Boolean) as typeof fullGame.team1Player1[];

    const team1Genders = team1.map(p => p.gender);
    const team2Genders = team2.map(p => p.gender);
    const isMixed      = detectMixed(team1Genders, team2Genders, fullGame.format);
    const ratingFormat = getRatingFormat(fullGame.format, isMixed);
    const gameCategory = toGameCategory(fullGame.gameType);

    const onTeam1 = team1.some(p => p.id === playerId);
    const myTeam  = onTeam1 ? team1 : team2;
    const oppTeam = onTeam1 ? team2 : team1;
    const myScore  = onTeam1 ? fullGame.team1Score : fullGame.team2Score;
    const oppScore = onTeam1 ? fullGame.team2Score : fullGame.team1Score;

    // Get this player's category rating just before this game (from rebuilt CategoryRating)
    const myCatRow = await prisma.playerCategoryRating.findUnique({
      where: { playerId_format_gameCategory: { playerId, format: ratingFormat, gameCategory } },
    });
    const myRatingBefore = myCatRow?.rating ?? rounded;

    // Get partner's rating: use their RatingHistory.ratingBefore for this game if available,
    // otherwise fall back to their current initialRating
    const partner = myTeam.find(p => p.id !== playerId) ?? null;
    let partnerRate: number | null = null;
    let partnerAge: number | null = null;
    let partnerGender: string | null = null;
    if (partner) {
      const partnerHist = fullGame.ratingHistory.find(h => h.playerId === partner.id);
      partnerRate   = partnerHist?.ratingBefore ?? partner.initialRating;
      partnerAge    = pickleballAge(partner.dateOfBirth);
      partnerGender = partner.gender;
    }

    // Opponents' ratings from their RatingHistory for this game
    const oppRates:   number[] = [];
    const oppAges:    number[] = [];
    const oppGenders: string[] = [];
    for (const opp of oppTeam) {
      const oppHist = fullGame.ratingHistory.find(h => h.playerId === opp.id);
      oppRates.push(oppHist?.ratingBefore ?? opp.initialRating);
      oppAges.push(pickleballAge(opp.dateOfBirth));
      oppGenders.push(opp.gender);
    }

    const result = calcNewRating({
      playerRate:    myRatingBefore,
      playerAge:     pickleballAge(player.dateOfBirth),
      playerGender:  player.gender,
      partnerRate,
      partnerAge,
      partnerGender,
      oppRates,
      oppAges,
      oppGenders,
      myScore,
      oppScore,
      gameType: fullGame.gameType,
    });

    const won = myScore > oppScore;
    const clampedCatRating = Math.min(8.0, Math.max(1.0, result.newRating));

    // Upsert CategoryRating for this player
    await prisma.playerCategoryRating.upsert({
      where: { playerId_format_gameCategory: { playerId, format: ratingFormat, gameCategory } },
      create: { playerId, format: ratingFormat, gameCategory, rating: clampedCatRating, gamesPlayed: 1, wins: won ? 1 : 0 },
      update: { rating: clampedCatRating, gamesPlayed: { increment: 1 }, ...(won && { wins: { increment: 1 } }) },
    });

    // Rebuild RatingHistory entry for this player for this game
    await prisma.ratingHistory.create({
      data: {
        playerId,
        gameId:         fullGame.id,
        ratingFormat,
        ratingBefore:   myRatingBefore,
        ratingAfter:    clampedCatRating,
        delta:          clampedCatRating - myRatingBefore,
        winLossFactor:  result.factors.winLoss,
        typeFactor:     result.factors.type,
        genderFactor:   result.factors.gender,
        ageFactor:      result.factors.age,
        rateTypeFactor: result.factors.rateType,
      },
    });

    // Recompute Player denorm fields after each game
    const allCatRows = await prisma.playerCategoryRating.findMany({ where: { playerId } });

    const fmtAvg = (fmt: string) => {
      const rows  = allCatRows.filter(r => r.format === fmt);
      const games = rows.reduce((s, r) => s + r.gamesPlayed, 0);
      const wsum  = rows.reduce((s, r) => s + r.rating * r.gamesPlayed, 0);
      return { rating: games > 0 ? wsum / games : rounded, games };
    };

    const s = fmtAvg("SINGLES");
    const d = fmtAvg("DOUBLES");
    const m = fmtAvg("MIXED");
    const totalGames    = s.games + d.games + m.games;
    const overallRating = totalGames > 0
      ? (s.rating * s.games + d.rating * d.games + m.rating * m.games) / totalGames
      : rounded;

    await prisma.player.update({
      where: { id: playerId },
      data: {
        singlesRating:      s.rating,
        doublesRating:      d.rating,
        mixedRating:        m.rating,
        singlesGamesPlayed: s.games,
        doublesGamesPlayed: d.games,
        mixedGamesPlayed:   m.games,
        currentRating:      Math.min(8.0, Math.max(1.0, overallRating)),
        gamesPlayed:        { increment: 1 },
      },
    });
  }

  const updated = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, name: true, currentRating: true, initialRating: true },
  });
  return NextResponse.json(updated);
}
