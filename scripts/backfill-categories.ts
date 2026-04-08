/**
 * One-off script: backfill selfRatedCategory for existing players.
 *
 * - All 15 PPA tour players (identified by @ppatour.example.com email) → PRO
 * - The 8 sample players → randomly assigned
 *
 * Run with:
 *   npx tsx scripts/backfill-categories.ts
 */

import { prisma } from "../lib/prisma";
import { CATEGORY_INITIAL_RATING } from "../lib/rating/algorithm";

const CATEGORIES = ["NOVICE", "INTERMEDIATE", "ADVANCED", "PRO"] as const;

// Fixed random assignments for the 8 sample players so re-runs are idempotent
const SAMPLE_ASSIGNMENTS: Record<string, string> = {
  "Alex Turner":    "ADVANCED",
  "Marcus Johnson": "INTERMEDIATE",
  "Derek Chen":     "INTERMEDIATE",
  "Ryan Patel":     "NOVICE",
  "Sarah Williams": "ADVANCED",
  "Jessica Lee":    "INTERMEDIATE",
  "Amanda Brooks":  "NOVICE",
  "Priya Sharma":   "NOVICE",
};

async function main() {
  const players = await prisma.player.findMany({ include: { user: true } });

  for (const player of players) {
    const isPPA = player.user.email?.endsWith("@ppatour.example.com");
    const category = isPPA
      ? "PRO"
      : (SAMPLE_ASSIGNMENTS[player.name] ?? "NOVICE");

    await prisma.player.update({
      where: { id: player.id },
      data: { selfRatedCategory: category },
    });

    console.log(`  ${player.name.padEnd(22)} → ${category}`);
  }

  console.log("\n✅  Category backfill complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
