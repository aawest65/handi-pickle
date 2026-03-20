import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      include: {
        leagueMatches: {
          include: {
            match: {
              include: {
                team1Player1: true,
                team1Player2: true,
                team2Player1: true,
                team2Player2: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(leagues);
  } catch (error) {
    console.error("GET /api/leagues error:", error);
    return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, season, startDate, endDate, description } = body as {
      name: string;
      season: string;
      startDate: string;
      endDate?: string;
      description?: string;
    };

    if (!name || !season || !startDate) {
      return NextResponse.json(
        { error: "Name, season, and startDate are required" },
        { status: 400 }
      );
    }

    const league = await prisma.league.create({
      data: {
        name,
        season,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description: description ?? null,
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error("POST /api/leagues error:", error);
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
