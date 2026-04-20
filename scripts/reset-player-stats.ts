/**
 * One-time script: resets all player stats to match actual game history.
 * Run after manually deleting games outside the API (e.g., test data cleanup).
 *
 * Usage: npx tsx scripts/reset-player-stats.ts
 */
import { config } from "dotenv";
config({ path: new URL("../.env", import.meta.url).pathname });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const players = await prisma.player.findMany({
    select: { id: true, initialRating: true, name: true },
  });

  for (const player of players) {
    // Delete stale category rows
    await prisma.playerCategoryRating.deleteMany({ where: { playerId: player.id } });

    // Count actual remaining games
    const gameCount = await prisma.game.count({
      where: {
        OR: [
          { team1Player1Id: player.id },
          { team1Player2Id: player.id },
          { team2Player1Id: player.id },
          { team2Player2Id: player.id },
        ],
      },
    });

    // Reset player to initial state
    await prisma.player.update({
      where: { id: player.id },
      data: {
        currentRating:      player.initialRating,
        singlesRating:      player.initialRating,
        doublesRating:      player.initialRating,
        mixedRating:        player.initialRating,
        gamesPlayed:        gameCount,
        singlesGamesPlayed: 0,
        doublesGamesPlayed: 0,
        mixedGamesPlayed:   0,
      },
    });

    console.log(`Reset ${player.name}: ${gameCount} games remaining`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
