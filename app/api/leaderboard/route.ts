import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickleballAge } from "@/lib/pickleballAge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender"); // optional: "MALE" | "FEMALE"

    const players = await prisma.player.findMany({
      where: {
        ...(gender ? { gender } : {}),
      },
      orderBy: { currentRating: "desc" },
    });

    const leaderboard = players.map((p, index) => ({
      rank:         index + 1,
      playerId:     p.id,
      playerName:   p.name,
      playerGender: p.gender,
      playerAge:    pickleballAge(p.dateOfBirth),
      playerCity:   p.city,
      playerState:  p.state,
      rating:       p.currentRating,
      gamesPlayed:  p.gamesPlayed,
      category:     p.selfRatedCategory,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
