import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        ratingHistory: {
          include: { game: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        team1Player1Games: {
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
          orderBy: { date: "desc" },
          take: 10,
        },
        team2Player1Games: {
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("GET /api/players/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}
