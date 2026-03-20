import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playType = searchParams.get("playType") ?? "RECREATIONAL";
    const format = searchParams.get("format") ?? "MENS_SINGLES";

    const ratings = await prisma.rating.findMany({
      where: {
        playType,
        format,
        gamesPlayed: { gt: 0 },
      },
      include: {
        player: true,
      },
      orderBy: { rating: "desc" },
    });

    const leaderboard = ratings.map((r: typeof ratings[number], index: number) => ({
      rank: index + 1,
      playerId: r.playerId,
      playerName: r.player.name,
      playerGender: r.player.gender,
      rating: r.rating,
      reliability: r.reliability,
      gamesPlayed: r.gamesPlayed,
      playType: r.playType,
      format: r.format,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
