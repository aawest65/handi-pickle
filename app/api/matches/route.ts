import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processMatch } from "@/lib/rating/algorithm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playType = searchParams.get("playType");
    const format = searchParams.get("format");
    const playerId = searchParams.get("playerId");

    const matches = await prisma.match.findMany({
      where: {
        ...(playType ? { playType } : {}),
        ...(format ? { format } : {}),
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
        tournamentMatch: { include: { tournament: true } },
        leagueMatch: { include: { league: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      playType,
      format,
      date,
      team1Player1Id,
      team1Player2Id,
      team2Player1Id,
      team2Player2Id,
      team1Score,
      team2Score,
      tournamentId,
      leagueId,
      isMedalRound,
    } = body as {
      playType: string;
      format: string;
      date: string;
      team1Player1Id: string;
      team1Player2Id?: string;
      team2Player1Id: string;
      team2Player2Id?: string;
      team1Score: number;
      team2Score: number;
      tournamentId?: string;
      leagueId?: string;
      isMedalRound?: boolean;
    };

    // Validate required fields
    if (!playType || !format || !date || !team1Player1Id || !team2Player1Id) {
      return NextResponse.json(
        { error: "playType, format, date, team1Player1Id, and team2Player1Id are required" },
        { status: 400 }
      );
    }

    if (team1Score === undefined || team2Score === undefined) {
      return NextResponse.json({ error: "Scores are required" }, { status: 400 });
    }

    if (team1Score === team2Score) {
      return NextResponse.json({ error: "Matches cannot end in a tie" }, { status: 400 });
    }

    const winningSide = team1Score > team2Score ? "TEAM1" : "TEAM2";

    const match = await prisma.match.create({
      data: {
        playType,
        format,
        date: new Date(date),
        team1Player1Id,
        team1Player2Id: team1Player2Id ?? null,
        team2Player1Id,
        team2Player2Id: team2Player2Id ?? null,
        team1Score,
        team2Score,
        winningSide,
        isMedalRound: isMedalRound ?? false,
        ...(tournamentId
          ? {
              tournamentMatch: {
                create: { tournamentId },
              },
            }
          : {}),
        ...(leagueId
          ? {
              leagueMatch: {
                create: { leagueId },
              },
            }
          : {}),
      },
      include: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
      },
    });

    // Update player ratings
    await processMatch(match.id);

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches error:", error);
    return NextResponse.json({ error: "Failed to record match" }, { status: 500 });
  }
}
