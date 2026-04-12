import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/rating-report?playerId=  — SUPER_ADMIN only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const playerId = new URL(req.url).searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      name: true,
      playerNumber: true,
      currentRating: true,
      gamesPlayed: true,
      ratingHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          game: {
            include: {
              team1Player1: { select: { id: true, name: true } },
              team1Player2: { select: { id: true, name: true } },
              team2Player1: { select: { id: true, name: true } },
              team2Player2: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  return NextResponse.json(player);
}
