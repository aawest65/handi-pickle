import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        tournamentMatches: {
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
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("GET /api/tournaments error:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, location, description } = body as {
      name: string;
      startDate: string;
      endDate?: string;
      location?: string;
      description?: string;
    };

    if (!name || !startDate) {
      return NextResponse.json({ error: "Name and startDate are required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location ?? null,
        description: description ?? null,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("POST /api/tournaments error:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
