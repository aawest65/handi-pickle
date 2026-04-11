import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/players/[id] — update a player's current rating (SUPER_ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: playerId } = await params;
  const { currentRating } = await req.json() as { currentRating: number };

  if (typeof currentRating !== "number" || currentRating < 1.0 || currentRating > 8.0) {
    return NextResponse.json({ error: "Rating must be between 1.0 and 8.0" }, { status: 400 });
  }

  let player;
  try {
    player = await prisma.player.update({
      where: { id: playerId },
      data: { currentRating: Math.round(currentRating * 100) / 100 },
      select: { id: true, name: true, currentRating: true },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/players] prisma error:", err);
    return NextResponse.json({ error: "Database error", detail: String(err) }, { status: 500 });
  }

  console.log("[PATCH /api/admin/players] updated:", player);
  return NextResponse.json(player);
}
