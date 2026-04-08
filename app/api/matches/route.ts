import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processGame } from "@/lib/rating/algorithm";

const VALID_GAME_TYPES = ["REC", "CLUB", "TOURNEY_REG", "TOURNEY_MEDAL"] as const;
const VALID_FORMATS    = ["SINGLES", "DOUBLES"] as const;

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
    } = body as {
      gameType:       string;
      format:         string;
      date:           string;
      maxScore?:      number;
      team1Player1Id: string;
      team1Player2Id?: string;
      team2Player1Id: string;
      team2Player2Id?: string;
      team1Score:     number;
      team2Score:     number;
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

    const game = await prisma.game.create({
      data: {
        gameType,
        format,
        date:          new Date(date),
        maxScore:      maxScore ?? 11,
        team1Score,
        team2Score,
        team1Player1Id,
        team1Player2Id: team1Player2Id ?? null,
        team2Player1Id,
        team2Player2Id: team2Player2Id ?? null,
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
