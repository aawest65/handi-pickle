import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickleballAge } from "@/lib/pickleballAge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender"); // optional: "MALE" | "FEMALE"
    const format = searchParams.get("format"); // optional: "SINGLES" | "DOUBLES" | "MIXED"
    const clubId = searchParams.get("clubId"); // optional: club filter

    // For format-specific leaderboards, only include players who have played that format
    const formatFilter = format === "SINGLES"
      ? { singlesGamesPlayed: { gt: 0 } }
      : format === "DOUBLES"
      ? { doublesGamesPlayed: { gt: 0 } }
      : format === "MIXED"
      ? { mixedGamesPlayed: { gt: 0 } }
      : {};

    const ratingField = format === "SINGLES" ? "singlesRating"
      : format === "DOUBLES" ? "doublesRating"
      : format === "MIXED"   ? "mixedRating"
      : "currentRating";

    const players = await prisma.player.findMany({
      where: {
        ...(gender ? { gender } : {}),
        ...(clubId ? { clubId } : {}),
        ...formatFilter,
      },
      include: { club: { select: { id: true, name: true } } },
      orderBy: { [ratingField]: "desc" },
    });

    const leaderboard = players.map((p, index) => ({
      rank:         index + 1,
      playerId:     p.id,
      playerName:   p.name,
      playerGender: p.gender,
      playerAge:    pickleballAge(p.dateOfBirth),
      playerCity:   p.city,
      playerState:  p.state,
      playerClub:   p.club?.name ?? null,
      rating:       format === "SINGLES" ? p.singlesRating
                  : format === "DOUBLES" ? p.doublesRating
                  : format === "MIXED"   ? p.mixedRating
                  : p.currentRating,
      gamesPlayed:  format === "SINGLES" ? p.singlesGamesPlayed
                  : format === "DOUBLES" ? p.doublesGamesPlayed
                  : format === "MIXED"   ? p.mixedGamesPlayed
                  : p.gamesPlayed,
      category:     p.selfRatedCategory,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
