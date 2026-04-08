/**
 * One-time script to add city/state to existing seeded players.
 * Run with: npx tsx prisma/seed-locations.ts
 */

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

const locations: Record<string, { city: string; state: string }> = {
  "Alex Turner":     { city: "Austin",       state: "TX" },
  "Marcus Johnson":  { city: "Atlanta",       state: "GA" },
  "Derek Chen":      { city: "Seattle",       state: "WA" },
  "Ryan Patel":      { city: "Phoenix",       state: "AZ" },
  "Sarah Williams":  { city: "Nashville",     state: "TN" },
  "Jessica Lee":     { city: "San Diego",     state: "CA" },
  "Amanda Brooks":   { city: "Denver",        state: "CO" },
  "Priya Sharma":    { city: "Chicago",       state: "IL" },
};

async function main() {
  const players = await prisma.player.findMany({ select: { id: true, name: true } });

  for (const player of players) {
    const loc = locations[player.name];
    if (loc) {
      await prisma.player.update({
        where: { id: player.id },
        data: { city: loc.city, state: loc.state },
      });
      console.log(`✓ ${player.name} → ${loc.city}, ${loc.state}`);
    } else {
      console.log(`⚠ No location defined for "${player.name}" — skipped`);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
