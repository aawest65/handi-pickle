/**
 * Backfills PlayerCategoryRating for all existing games.
 *
 * Approach: for each player, group their RatingHistory records by
 * (ratingFormat, gameCategory). The last ratingAfter in each group becomes
 * the seeded category rating, and wins are counted from game scores.
 *
 * This is an approximation for historical data — the algorithm historically
 * used format-level ratings as inputs rather than category-level ones. Going
 * forward, processGame uses the correct per-category inputs.
 *
 * Run once after applying migration 20260415000002_player_category_rating:
 *   npx tsx scripts/backfill-category-ratings.ts
 */

import { prisma } from "../lib/prisma";

function toGameCategory(gameType: string): "REC" | "CLUB" | "TOURNEY" {
  if (gameType === "REC")  return "REC";
  if (gameType === "CLUB") return "CLUB";
  return "TOURNEY";
}

async function main() {
  const players = await prisma.player.findMany({
    include: {
      ratingHistory: {
        include: { game: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  console.log(`Backfilling category ratings for ${players.length} players...`);

  for (const player of players) {
    // Group RatingHistory by "format::gameCategory"
    type GroupEntry = {
      histories: typeof player.ratingHistory;
      wins:      number;
    };
    const groups = new Map<string, GroupEntry>();

    for (const rh of player.ratingHistory) {
      const gameCategory = toGameCategory(rh.game.gameType);
      const key = `${rh.ratingFormat}::${gameCategory}`;

      if (!groups.has(key)) groups.set(key, { histories: [], wins: 0 });

      const group = groups.get(key)!;
      group.histories.push(rh);

      const onTeam1 = [rh.game.team1Player1Id, rh.game.team1Player2Id].includes(player.id);
      const won     = onTeam1
        ? rh.game.team1Score > rh.game.team2Score
        : rh.game.team2Score > rh.game.team1Score;
      if (won) group.wins++;
    }

    for (const [key, group] of groups) {
      const [format, gameCategory] = key.split("::");
      const last = group.histories.at(-1);
      if (!last) continue;

      await prisma.playerCategoryRating.upsert({
        where: {
          playerId_format_gameCategory: {
            playerId:     player.id,
            format,
            gameCategory,
          },
        },
        create: {
          playerId:    player.id,
          format,
          gameCategory,
          rating:      last.ratingAfter,
          gamesPlayed: group.histories.length,
          wins:        group.wins,
        },
        update: {
          rating:      last.ratingAfter,
          gamesPlayed: group.histories.length,
          wins:        group.wins,
        },
      });
    }

    if (groups.size > 0) {
      console.log(`  ${player.name} (${player.playerNumber}): ${groups.size} category track(s)`);
    }
  }

  console.log("Backfill complete.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => (prisma as any).$disconnect?.());
