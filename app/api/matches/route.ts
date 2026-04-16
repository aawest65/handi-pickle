import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { processGame } from "@/lib/rating/algorithm";

const VALID_GAME_TYPES  = ["REC", "CLUB", "TOURNEY_REG", "TOURNEY_MEDAL"] as const;
const TOURNEY_GAME_TYPES = ["TOURNEY_REG", "TOURNEY_MEDAL"] as const;
const VALID_FORMATS      = ["SINGLES", "DOUBLES"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType");
    const playerId = searchParams.get("playerId");

    const games = await prisma.game.findMany({
      where: {
        ...(gameType ? { gameType } : {}),
        ...(playerId
          ? {
              OR: [
                { team1Player1Id: playerId },
                { team1Player2Id: playerId },
                { team2Player1Id: playerId },
                { team2Player2Id: playerId },
              ],
            }
          : {}),
      },
      include: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
        ratingHistory: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role                 = (session.user as { role?: string }).role ?? "USER";
    const isTournamentDirector = (session.user as { isTournamentDirector?: boolean }).isTournamentDirector ?? false;
    const isAdmin              = role === "ADMIN" || role === "SUPER_ADMIN";
    const canEnterTournament   = isAdmin || isTournamentDirector;

    const body = await request.json();
    const {
      gameType,
      format,
      date,
      maxScore,
      team1Player1Id,
      team1Player2Id,
      team2Player1Id,
      team2Player2Id,
      team1Score,
      team2Score,
      tournamentId,
    } = body as {
      gameType:        string;
      format:          string;
      date:            string;
      maxScore?:       number;
      team1Player1Id:  string;
      team1Player2Id?: string;
      team2Player1Id:  string;
      team2Player2Id?: string;
      team1Score:      number;
      team2Score:      number;
      tournamentId?:   string;
    };

    if (!gameType || !VALID_GAME_TYPES.includes(gameType as typeof VALID_GAME_TYPES[number])) {
      return NextResponse.json({ error: "Invalid gameType" }, { status: 400 });
    }
    if (!format || !VALID_FORMATS.includes(format as typeof VALID_FORMATS[number])) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }
    if (!date || !team1Player1Id || !team2Player1Id) {
      return NextResponse.json(
        { error: "date, team1Player1Id, and team2Player1Id are required" },
        { status: 400 }
      );
    }
    if (team1Score === undefined || team2Score === undefined) {
      return NextResponse.json({ error: "Scores are required" }, { status: 400 });
    }
    if (team1Score === team2Score) {
      return NextResponse.json({ error: "Games cannot end in a tie" }, { status: 400 });
    }
    if (format === "DOUBLES" && (!team1Player2Id || !team2Player2Id)) {
      return NextResponse.json(
        { error: "Doubles requires two players per team" },
        { status: 400 }
      );
    }

    // Tournament game types can only be submitted by TDs and admins
    if (TOURNEY_GAME_TYPES.includes(gameType as typeof TOURNEY_GAME_TYPES[number]) && !canEnterTournament) {
      return NextResponse.json({ error: "Only Tournament Directors can submit tournament scores" }, { status: 403 });
    }

    // If a tournament is linked, validate the TD is assigned to it and all players are registered
    if (tournamentId) {
      if (!canEnterTournament) {
        return NextResponse.json({ error: "Only Tournament Directors can link a tournament" }, { status: 403 });
      }
      const userId = (session.user as { id?: string }).id ?? "";
      if (!isAdmin) {
        const director = await prisma.tournamentDirector.findUnique({
          where: { tournamentId_userId: { tournamentId, userId } },
        });
        if (!director) {
          return NextResponse.json({ error: "You are not a director of this tournament" }, { status: 403 });
        }
      }
      const playerIds = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id].filter(Boolean) as string[];
      const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId, playerId: { in: playerIds } },
        select: { playerId: true },
      });
      const registeredIds = new Set(registrations.map(r => r.playerId));
      const unregistered = playerIds.filter(id => !registeredIds.has(id));
      if (unregistered.length > 0) {
        const names = await prisma.player.findMany({
          where: { id: { in: unregistered } },
          select: { name: true },
        });
        return NextResponse.json(
          { error: `Not all players are registered in this tournament: ${names.map(n => n.name).join(", ")}` },
          { status: 400 }
        );
      }
    }

    const game = await prisma.game.create({
      data: {
        gameType,
        format,
        date:           new Date(date),
        maxScore:       maxScore ?? 11,
        team1Score,
        team2Score,
        team1Player1Id,
        team1Player2Id:  team1Player2Id  ?? null,
        team2Player1Id,
        team2Player2Id:  team2Player2Id  ?? null,
        tournamentId:    tournamentId    ?? null,
      },
      include: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
      },
    });

    await processGame(game.id);

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches error:", error);
    return NextResponse.json({ error: "Failed to record game" }, { status: 500 });
  }
}
