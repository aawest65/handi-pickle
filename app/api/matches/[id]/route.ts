import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Load game and its rating history
    const game = await prisma.game.findUnique({
      where: { id },
      include: { ratingHistory: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Reverse rating changes for each player that was affected.
    // We subtract the stored delta from the player's current rating and decrement
    // both the format-specific and overall counters.
    for (const entry of game.ratingHistory) {
      const ratingField =
        entry.ratingFormat === "SINGLES" ? "singlesRating"
        : entry.ratingFormat === "DOUBLES" ? "doublesRating"
        : "mixedRating";

      const gamesPlayedField =
        entry.ratingFormat === "SINGLES" ? "singlesGamesPlayed"
        : entry.ratingFormat === "DOUBLES" ? "doublesGamesPlayed"
        : "mixedGamesPlayed";

      await prisma.player.update({
        where: { id: entry.playerId },
        data: {
          [ratingField]:      { decrement: entry.delta },
          [gamesPlayedField]: { decrement: 1 },
          currentRating:      { decrement: entry.delta },
          gamesPlayed:        { decrement: 1 },
        },
      });
    }

    // Delete rating history first (FK constraint), then the game
    await prisma.ratingHistory.deleteMany({ where: { gameId: id } });
    await prisma.game.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/matches/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
