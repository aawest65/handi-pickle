import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — return game + opponent info so the rating page can render
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      format: true,
      date: true,
      team1Score: true,
      team2Score: true,
      team1Player1: { select: { id: true, name: true, avatarUrl: true } },
      team1Player2: { select: { id: true, name: true, avatarUrl: true } },
      team2Player1: { select: { id: true, name: true, avatarUrl: true } },
      team2Player2: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const pid = player.id;
  const t1 = [game.team1Player1, game.team1Player2].filter(Boolean).map((p) => p!.id);
  const t2 = [game.team2Player1, game.team2Player2].filter(Boolean).map((p) => p!.id);
  const allIds = [...t1, ...t2];

  if (!allIds.includes(pid)) return NextResponse.json({ error: "You did not play in this game" }, { status: 403 });

  // Opponents = players on the other team
  const onTeam1 = t1.includes(pid);
  const opponentIds = onTeam1 ? t2 : t1;
  const allPlayers = [game.team1Player1, game.team1Player2, game.team2Player1, game.team2Player2].filter(Boolean) as { id: string; name: string; avatarUrl: string | null }[];
  const opponents = allPlayers.filter((p) => opponentIds.includes(p.id));

  // Already-submitted ratings for this game by this player
  const existing = await prisma.sportsmanshipRating.findMany({
    where: { gameId, raterId: pid },
    select: { ratedPlayerId: true, score: true },
  });
  const alreadyRated = new Set(existing.map((r) => r.ratedPlayerId));

  return NextResponse.json({ game, opponents, alreadyRated: [...alreadyRated] });
}

// POST — submit ratings
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      team1Player1Id: true,
      team1Player2Id: true,
      team2Player1Id: true,
      team2Player2Id: true,
    },
  });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const pid = player.id;
  const t1 = [game.team1Player1Id, game.team1Player2Id].filter(Boolean) as string[];
  const t2 = [game.team2Player1Id, game.team2Player2Id].filter(Boolean) as string[];
  const allIds = [...t1, ...t2];

  if (!allIds.includes(pid)) return NextResponse.json({ error: "You did not play in this game" }, { status: 403 });

  const onTeam1 = t1.includes(pid);
  const validOpponentIds = new Set(onTeam1 ? t2 : t1);

  const { ratings } = await req.json() as { ratings: { playerId: string; score: number }[] };
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: "No ratings provided" }, { status: 400 });
  }

  for (const { playerId, score } of ratings) {
    if (!validOpponentIds.has(playerId)) {
      return NextResponse.json({ error: "Invalid player in ratings" }, { status: 400 });
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: "Score must be 1–5" }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const { playerId, score } of ratings) {
      const existing = await tx.sportsmanshipRating.findUnique({
        where: { gameId_raterId_ratedPlayerId: { gameId, raterId: pid, ratedPlayerId: playerId } },
        select: { score: true },
      });

      if (existing) {
        const diff = score - existing.score;
        await tx.sportsmanshipRating.update({
          where: { gameId_raterId_ratedPlayerId: { gameId, raterId: pid, ratedPlayerId: playerId } },
          data: { score },
        });
        await tx.player.update({
          where: { id: playerId },
          data: { sportsmanshipSum: { increment: diff } },
        });
      } else {
        await tx.sportsmanshipRating.create({
          data: { gameId, raterId: pid, ratedPlayerId: playerId, score },
        });
        await tx.player.update({
          where: { id: playerId },
          data: { sportsmanshipSum: { increment: score }, sportsmanshipCount: { increment: 1 } },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
