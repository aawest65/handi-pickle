/**
 * Seed extra games for Alex, Marcus, Sarah, Jessica to show rating progression.
 * Run with: npx tsx prisma/seed-games.ts
 * Safe to run multiple times — appends new matches without clearing existing data.
 */

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { processMatch } from "../lib/rating/algorithm";

const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

// Player IDs — resolved at runtime by name so re-seeding doesn't break this script
async function getPlayerIds() {
  const players = await prisma.player.findMany({ select: { id: true, name: true } });
  const find = (name: string) => {
    const p = players.find(p => p.name === name);
    if (!p) throw new Error(`Player "${name}" not found — run seed.ts first`);
    return p.id;
  };
  return {
    ALEX:    find("Alex Turner"),
    MARCUS:  find("Marcus Johnson"),
    SARAH:   find("Sarah Williams"),
    JESSICA: find("Jessica Lee"),
  };
}

type Side = "TEAM1" | "TEAM2";

interface MatchDef {
  playType: string;
  format: string;
  date: string;
  team1Player1Id: string;
  team1Player2Id?: string;
  team2Player1Id: string;
  team2Player2Id?: string;
  team1Score: number;
  team2Score: number;
  winningSide: Side;
  isMedalRound?: boolean;
}

async function createMatch(def: MatchDef): Promise<string> {
  const match = await prisma.match.create({
    data: {
      playType: def.playType,
      format: def.format,
      date: new Date(def.date),
      team1Player1Id: def.team1Player1Id,
      team1Player2Id: def.team1Player2Id ?? null,
      team2Player1Id: def.team2Player1Id,
      team2Player2Id: def.team2Player2Id ?? null,
      team1Score: def.team1Score,
      team2Score: def.team2Score,
      winningSide: def.winningSide,
      isMedalRound: def.isMedalRound ?? false,
    },
  });
  return match.id;
}

// Helper: score where team1 wins with given margin
function w(winner: number, loser: number): [number, number, Side] {
  return [winner, loser, "TEAM1"];
}
function l(loser: number, winner: number): [number, number, Side] {
  return [loser, winner, "TEAM2"];
}

async function main() {
  console.log("🎯  Seeding 60 extra games for Alex, Marcus, Sarah & Jessica...\n");

  const { ALEX, MARCUS, SARAH, JESSICA } = await getPlayerIds();

  // ── RECREATIONAL / MENS_SINGLES ─────────────────────────────────────────
  // Alex starts strong, Marcus closes the gap over time
  console.log("  RECREATIONAL / MENS_SINGLES (20 games)...");
  const mensSingles: MatchDef[] = [
    // Oct 2025 — Alex dominant
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-10-02", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 5,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-10-05", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-10-09", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 7,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-10-12", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-10-16", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 6,  winningSide: "TEAM1" },
    // Nov 2025 — Marcus improving
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-11-02", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 9,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-11-06", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-11-10", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-11-14", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-11-20", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    // Dec 2025 — evenly matched
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-12-03", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-12-07", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-12-11", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-12-15", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2025-12-19", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 9,  team2Score: 11, winningSide: "TEAM2" },
    // Jan 2026 — Marcus edges ahead
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2026-01-04", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2026-01-08", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2026-01-12", team1Player1Id: ALEX, team2Player1Id: MARCUS, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2026-01-16", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 6,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MENS_SINGLES", date: "2026-01-20", team1Player1Id: MARCUS, team2Player1Id: ALEX, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
  ];

  // ── RECREATIONAL / WOMENS_SINGLES ────────────────────────────────────────
  // Sarah starts ahead, Jessica closes fast
  console.log("  RECREATIONAL / WOMENS_SINGLES (20 games)...");
  const womensSingles: MatchDef[] = [
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-10-03", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 4,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-10-07", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 6,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-10-11", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 5,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-10-17", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 7,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-10-21", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-11-04", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 9,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-11-08", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-11-12", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-11-18", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-11-24", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-12-02", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-12-06", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-12-10", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-12-14", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2025-12-18", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2026-01-05", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 6,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2026-01-09", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2026-01-13", team1Player1Id: SARAH, team2Player1Id: JESSICA, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2026-01-17", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "WOMENS_SINGLES", date: "2026-01-21", team1Player1Id: JESSICA, team2Player1Id: SARAH, team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
  ];

  // ── RECREATIONAL / MIXED_DOUBLES ─────────────────────────────────────────
  // Alternating partners
  console.log("  RECREATIONAL / MIXED_DOUBLES (20 games)...");
  const mixedDoubles: MatchDef[] = [
    // Alex+Sarah vs Marcus+Jessica
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-10-04", team1Player1Id: ALEX, team1Player2Id: SARAH,   team2Player1Id: MARCUS, team2Player2Id: JESSICA, team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-10-08", team1Player1Id: MARCUS, team1Player2Id: JESSICA, team2Player1Id: ALEX,   team2Player2Id: SARAH,   team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-10-14", team1Player1Id: ALEX, team1Player2Id: SARAH,   team2Player1Id: MARCUS, team2Player2Id: JESSICA, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-10-18", team1Player1Id: MARCUS, team1Player2Id: JESSICA, team2Player1Id: ALEX,   team2Player2Id: SARAH,   team1Score: 9,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-10-22", team1Player1Id: ALEX, team1Player2Id: JESSICA, team2Player1Id: MARCUS, team2Player2Id: SARAH,   team1Score: 11, team2Score: 6,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-11-01", team1Player1Id: MARCUS, team1Player2Id: SARAH,   team2Player1Id: ALEX,   team2Player2Id: JESSICA, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-11-05", team1Player1Id: ALEX, team1Player2Id: SARAH,   team2Player1Id: MARCUS, team2Player2Id: JESSICA, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-11-09", team1Player1Id: MARCUS, team1Player2Id: JESSICA, team2Player1Id: ALEX,   team2Player2Id: SARAH,   team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-11-13", team1Player1Id: ALEX, team1Player2Id: JESSICA, team2Player1Id: MARCUS, team2Player2Id: SARAH,   team1Score: 9,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-11-17", team1Player1Id: MARCUS, team1Player2Id: SARAH,   team2Player1Id: ALEX,   team2Player2Id: JESSICA, team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-12-01", team1Player1Id: ALEX, team1Player2Id: SARAH,   team2Player1Id: MARCUS, team2Player2Id: JESSICA, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-12-05", team1Player1Id: MARCUS, team1Player2Id: JESSICA, team2Player1Id: ALEX,   team2Player2Id: SARAH,   team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-12-09", team1Player1Id: ALEX, team1Player2Id: JESSICA, team2Player1Id: MARCUS, team2Player2Id: SARAH,   team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-12-13", team1Player1Id: MARCUS, team1Player2Id: SARAH,   team2Player1Id: ALEX,   team2Player2Id: JESSICA, team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2025-12-17", team1Player1Id: ALEX, team1Player2Id: SARAH,   team2Player1Id: MARCUS, team2Player2Id: JESSICA, team1Score: 10, team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2026-01-03", team1Player1Id: MARCUS, team1Player2Id: JESSICA, team2Player1Id: ALEX,   team2Player2Id: SARAH,   team1Score: 11, team2Score: 7,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2026-01-07", team1Player1Id: ALEX, team1Player2Id: JESSICA, team2Player1Id: MARCUS, team2Player2Id: SARAH,   team1Score: 11, team2Score: 9,  winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2026-01-11", team1Player1Id: MARCUS, team1Player2Id: SARAH,   team2Player1Id: ALEX,   team2Player2Id: JESSICA, team1Score: 9,  team2Score: 11, winningSide: "TEAM2" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2026-01-15", team1Player1Id: ALEX, team1Player2Id: SARAH,   team2Player1Id: MARCUS, team2Player2Id: JESSICA, team1Score: 11, team2Score: 10, winningSide: "TEAM1" },
    { playType: "RECREATIONAL", format: "MIXED_DOUBLES", date: "2026-01-19", team1Player1Id: MARCUS, team1Player2Id: JESSICA, team2Player1Id: ALEX,   team2Player2Id: SARAH,   team1Score: 11, team2Score: 8,  winningSide: "TEAM1" },
  ];

  const allMatches = [...mensSingles, ...womensSingles, ...mixedDoubles];
  let count = 0;
  for (const def of allMatches) {
    const id = await createMatch(def);
    await processMatch(id);
    count++;
    if (count % 10 === 0) console.log(`    ${count}/${allMatches.length} matches processed...`);
  }

  console.log(`\n✅  Done! ${count} matches created and ratings updated.`);

  // Print final ratings for the 4 players
  console.log("\n📊  Final ratings snapshot:");
  for (const playerId of [ALEX, MARCUS, SARAH, JESSICA]) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { ratings: { orderBy: [{ playType: "asc" }, { format: "asc" }] } },
    });
    if (!player) continue;
    console.log(`\n  ${player.name}:`);
    for (const r of player.ratings) {
      console.log(`    ${r.playType} / ${r.format}: ${r.rating.toFixed(4)} (${r.gamesPlayed} games)`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
