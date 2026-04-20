import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toGameCategory, getRatingFormat } from "@/lib/rating/algorithm";

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
    const game = await prisma.game.findUnique({
      where: { id },
      include: { ratingHistory: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const gameCategory = toGameCategory(game.gameType);
    const ratingFormat = getRatingFormat(game.format, game.isMixed);

    // Reverse each player's category rating and recompute denorm fields.
    for (const entry of game.ratingHistory) {
      const won = entry.winLossFactor > 0;

      // Step back the category rating to ratingBefore; decrement gamesPlayed/wins.
      const catRow = await prisma.playerCategoryRating.findUnique({
        where: {
          playerId_format_gameCategory: {
            playerId:     entry.playerId,
            format:       ratingFormat,
            gameCategory,
          },
        },
      });

      if (catRow) {
        if (catRow.gamesPlayed <= 1) {
          await prisma.playerCategoryRating.delete({
            where: {
              playerId_format_gameCategory: {
                playerId:     entry.playerId,
                format:       ratingFormat,
                gameCategory,
              },
            },
          });
        } else {
          await prisma.playerCategoryRating.update({
            where: {
              playerId_format_gameCategory: {
                playerId:     entry.playerId,
                format:       ratingFormat,
                gameCategory,
              },
            },
            data: {
              rating:      entry.ratingBefore,
              gamesPlayed: { decrement: 1 },
              ...(won && { wins: { decrement: 1 } }),
            },
          });
        }
      }

      // Recompute Player denorm fields from remaining category rows.
      const allCatRows = await prisma.playerCategoryRating.findMany({
        where: { playerId: entry.playerId },
      });

      const fmtAvg = (fmt: string) => {
        const rows  = allCatRows.filter(r => r.format === fmt);
        const games = rows.reduce((s, r) => s + r.gamesPlayed, 0);
        const wsum  = rows.reduce((s, r) => s + r.rating * r.gamesPlayed, 0);
        return { rating: games > 0 ? wsum / games : null, games };
      };

      const s = fmtAvg("SINGLES");
      const d = fmtAvg("DOUBLES");
      const m = fmtAvg("MIXED");

      const player = await prisma.player.findUnique({
        where: { id: entry.playerId },
        select: { initialRating: true, gamesPlayed: true },
      });

      const totalGames = s.games + d.games + m.games;
      const overallRating = totalGames > 0
        ? ((s.rating ?? 0) * s.games + (d.rating ?? 0) * d.games + (m.rating ?? 0) * m.games) / totalGames
        : player?.initialRating ?? 3.0;

      await prisma.player.update({
        where: { id: entry.playerId },
        data: {
          singlesRating:      s.rating ?? player?.initialRating ?? 3.0,
          doublesRating:      d.rating ?? player?.initialRating ?? 3.0,
          mixedRating:        m.rating ?? player?.initialRating ?? 3.0,
          singlesGamesPlayed: s.games,
          doublesGamesPlayed: d.games,
          mixedGamesPlayed:   m.games,
          currentRating:      Math.min(8.0, Math.max(1.0, overallRating)),
          gamesPlayed:        Math.max(0, (player?.gamesPlayed ?? 1) - 1),
        },
      });
    }

    await prisma.ratingHistory.deleteMany({ where: { gameId: id } });
    await prisma.game.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/matches/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
