/**
 * Seed script for PickleRatings.
 *
 * Run with:
 *   npx tsx prisma/seed.ts
 *
 * Make sure to run migrations first:
 *   npx prisma migrate deploy
 */

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { processMatch } from "../lib/rating/algorithm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createUserAndPlayer(
  firstName: string,
  lastName: string,
  gender: "MALE" | "FEMALE",
  age: number
) {
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: `${firstName} ${lastName}`, password },
  });

  const player = await prisma.player.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: `${firstName} ${lastName}`,
      gender,
      age,
    },
  });

  return player;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Starting seed...");

  // -------------------------------------------------------------------------
  // Users & Players
  // -------------------------------------------------------------------------
  console.log("  Creating players...");

  const alex = await createUserAndPlayer("Alex", "Turner", "MALE", 28);
  const marcus = await createUserAndPlayer("Marcus", "Johnson", "MALE", 35);
  const derek = await createUserAndPlayer("Derek", "Chen", "MALE", 42);
  const ryan = await createUserAndPlayer("Ryan", "Patel", "MALE", 51);

  const sarah = await createUserAndPlayer("Sarah", "Williams", "FEMALE", 31);
  const jessica = await createUserAndPlayer("Jessica", "Lee", "FEMALE", 26);
  const amanda = await createUserAndPlayer("Amanda", "Brooks", "FEMALE", 47);
  const priya = await createUserAndPlayer("Priya", "Sharma", "FEMALE", 58);

  console.log("  8 players created.");

  // -------------------------------------------------------------------------
  // Tournament
  // -------------------------------------------------------------------------
  console.log("  Creating tournament...");
  const tournament = await prisma.tournament.upsert({
    where: { id: "seed-tournament-winter-classic-2025" },
    update: {},
    create: {
      id: "seed-tournament-winter-classic-2025",
      name: "Winter Classic 2025",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-01"),
    },
  });

  // -------------------------------------------------------------------------
  // League
  // -------------------------------------------------------------------------
  console.log("  Creating league...");
  const league = await prisma.league.upsert({
    where: { id: "seed-league-winter-2025" },
    update: {},
    create: {
      id: "seed-league-winter-2025",
      name: "Winter League 2025",
      season: "2025-Winter",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-01-31"),
    },
  });

  // -------------------------------------------------------------------------
  // Helper: create match + optionally link to tournament/league, then process
  // -------------------------------------------------------------------------
  type MatchInput = {
    playType: string;
    format: string;
    date: Date;
    team1Player1Id: string;
    team1Player2Id?: string;
    team2Player1Id: string;
    team2Player2Id?: string;
    team1Score: number;
    team2Score: number;
    winningSide: "TEAM1" | "TEAM2";
    tournamentId?: string;
    leagueId?: string;
  };

  async function createMatch(input: MatchInput) {
    const match = await prisma.match.create({
      data: {
        playType: input.playType,
        format: input.format,
        date: input.date,
        team1Player1Id: input.team1Player1Id,
        team1Player2Id: input.team1Player2Id ?? null,
        team2Player1Id: input.team2Player1Id,
        team2Player2Id: input.team2Player2Id ?? null,
        team1Score: input.team1Score,
        team2Score: input.team2Score,
        winningSide: input.winningSide,
      },
    });

    if (input.tournamentId) {
      await prisma.tournamentMatch.create({
        data: { tournamentId: input.tournamentId, matchId: match.id },
      });
    }

    if (input.leagueId) {
      await prisma.leagueMatch.create({
        data: { leagueId: input.leagueId, matchId: match.id },
      });
    }

    await processMatch(match.id);
    return match;
  }

  // -------------------------------------------------------------------------
  // RECREATIONAL — MENS_SINGLES
  // -------------------------------------------------------------------------
  console.log("  Seeding RECREATIONAL / MENS_SINGLES...");

  await createMatch({
    playType: "RECREATIONAL",
    format: "MENS_SINGLES",
    date: new Date("2025-10-01"),
    team1Player1Id: alex.id,
    team2Player1Id: marcus.id,
    team1Score: 11,
    team2Score: 7,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "MENS_SINGLES",
    date: new Date("2025-10-15"),
    team1Player1Id: alex.id,
    team2Player1Id: derek.id,
    team1Score: 11,
    team2Score: 9,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "MENS_SINGLES",
    date: new Date("2025-11-01"),
    team1Player1Id: marcus.id,
    team2Player1Id: derek.id,
    team1Score: 11,
    team2Score: 8,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "MENS_SINGLES",
    date: new Date("2025-11-15"),
    team1Player1Id: derek.id,
    team2Player1Id: ryan.id,
    team1Score: 11,
    team2Score: 6,
    winningSide: "TEAM1",
  });

  // -------------------------------------------------------------------------
  // RECREATIONAL — WOMENS_SINGLES
  // -------------------------------------------------------------------------
  console.log("  Seeding RECREATIONAL / WOMENS_SINGLES...");

  await createMatch({
    playType: "RECREATIONAL",
    format: "WOMENS_SINGLES",
    date: new Date("2025-10-05"),
    team1Player1Id: sarah.id,
    team2Player1Id: jessica.id,
    team1Score: 11,
    team2Score: 8,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "WOMENS_SINGLES",
    date: new Date("2025-10-20"),
    team1Player1Id: sarah.id,
    team2Player1Id: amanda.id,
    team1Score: 11,
    team2Score: 6,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "WOMENS_SINGLES",
    date: new Date("2025-11-05"),
    team1Player1Id: jessica.id,
    team2Player1Id: priya.id,
    team1Score: 11,
    team2Score: 9,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "WOMENS_SINGLES",
    date: new Date("2025-11-20"),
    team1Player1Id: amanda.id,
    team2Player1Id: priya.id,
    team1Score: 11,
    team2Score: 7,
    winningSide: "TEAM1",
  });

  // -------------------------------------------------------------------------
  // RECREATIONAL — MENS_DOUBLES
  // -------------------------------------------------------------------------
  console.log("  Seeding RECREATIONAL / MENS_DOUBLES...");

  await createMatch({
    playType: "RECREATIONAL",
    format: "MENS_DOUBLES",
    date: new Date("2025-10-10"),
    team1Player1Id: alex.id,
    team1Player2Id: marcus.id,
    team2Player1Id: derek.id,
    team2Player2Id: ryan.id,
    team1Score: 11,
    team2Score: 8,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "MENS_DOUBLES",
    date: new Date("2025-11-10"),
    team1Player1Id: alex.id,
    team1Player2Id: derek.id,
    team2Player1Id: marcus.id,
    team2Player2Id: ryan.id,
    team1Score: 11,
    team2Score: 9,
    winningSide: "TEAM1",
  });

  // -------------------------------------------------------------------------
  // RECREATIONAL — WOMENS_DOUBLES
  // -------------------------------------------------------------------------
  console.log("  Seeding RECREATIONAL / WOMENS_DOUBLES...");

  await createMatch({
    playType: "RECREATIONAL",
    format: "WOMENS_DOUBLES",
    date: new Date("2025-10-12"),
    team1Player1Id: sarah.id,
    team1Player2Id: jessica.id,
    team2Player1Id: amanda.id,
    team2Player2Id: priya.id,
    team1Score: 11,
    team2Score: 7,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "WOMENS_DOUBLES",
    date: new Date("2025-11-12"),
    team1Player1Id: sarah.id,
    team1Player2Id: amanda.id,
    team2Player1Id: jessica.id,
    team2Player2Id: priya.id,
    team1Score: 11,
    team2Score: 6,
    winningSide: "TEAM1",
  });

  // -------------------------------------------------------------------------
  // RECREATIONAL — MIXED_DOUBLES
  // -------------------------------------------------------------------------
  console.log("  Seeding RECREATIONAL / MIXED_DOUBLES...");

  await createMatch({
    playType: "RECREATIONAL",
    format: "MIXED_DOUBLES",
    date: new Date("2025-10-18"),
    team1Player1Id: alex.id,
    team1Player2Id: sarah.id,
    team2Player1Id: marcus.id,
    team2Player2Id: jessica.id,
    team1Score: 11,
    team2Score: 8,
    winningSide: "TEAM1",
  });

  await createMatch({
    playType: "RECREATIONAL",
    format: "MIXED_DOUBLES",
    date: new Date("2025-11-18"),
    team1Player1Id: derek.id,
    team1Player2Id: priya.id,
    team2Player1Id: ryan.id,
    team2Player2Id: amanda.id,
    team1Score: 11,
    team2Score: 9,
    winningSide: "TEAM1",
  });

  // -------------------------------------------------------------------------
  // TOURNAMENT — MENS_SINGLES
  // -------------------------------------------------------------------------
  console.log("  Seeding TOURNAMENT / MENS_SINGLES...");

  await createMatch({
    playType: "TOURNAMENT",
    format: "MENS_SINGLES",
    date: new Date("2025-12-01"),
    team1Player1Id: alex.id,
    team2Player1Id: ryan.id,
    team1Score: 11,
    team2Score: 5,
    winningSide: "TEAM1",
    tournamentId: tournament.id,
  });

  await createMatch({
    playType: "TOURNAMENT",
    format: "MENS_SINGLES",
    date: new Date("2025-12-01"),
    team1Player1Id: marcus.id,
    team2Player1Id: derek.id,
    team1Score: 11,
    team2Score: 7,
    winningSide: "TEAM1",
    tournamentId: tournament.id,
  });

  // -------------------------------------------------------------------------
  // TOURNAMENT — WOMENS_SINGLES
  // -------------------------------------------------------------------------
  console.log("  Seeding TOURNAMENT / WOMENS_SINGLES...");

  await createMatch({
    playType: "TOURNAMENT",
    format: "WOMENS_SINGLES",
    date: new Date("2025-12-01"),
    team1Player1Id: sarah.id,
    team2Player1Id: priya.id,
    team1Score: 11,
    team2Score: 6,
    winningSide: "TEAM1",
    tournamentId: tournament.id,
  });

  await createMatch({
    playType: "TOURNAMENT",
    format: "WOMENS_SINGLES",
    date: new Date("2025-12-01"),
    team1Player1Id: jessica.id,
    team2Player1Id: amanda.id,
    team1Score: 11,
    team2Score: 8,
    winningSide: "TEAM1",
    tournamentId: tournament.id,
  });

  // -------------------------------------------------------------------------
  // LEAGUE — MIXED_DOUBLES
  // -------------------------------------------------------------------------
  console.log("  Seeding LEAGUE / MIXED_DOUBLES...");

  await createMatch({
    playType: "LEAGUE",
    format: "MIXED_DOUBLES",
    date: new Date("2025-12-10"),
    team1Player1Id: alex.id,
    team1Player2Id: jessica.id,
    team2Player1Id: marcus.id,
    team2Player2Id: sarah.id,
    team1Score: 11,
    team2Score: 9,
    winningSide: "TEAM1",
    leagueId: league.id,
  });

  await createMatch({
    playType: "LEAGUE",
    format: "MIXED_DOUBLES",
    date: new Date("2025-12-10"),
    team1Player1Id: derek.id,
    team1Player2Id: amanda.id,
    team2Player1Id: ryan.id,
    team2Player2Id: priya.id,
    team1Score: 11,
    team2Score: 7,
    winningSide: "TEAM1",
    leagueId: league.id,
  });

  console.log("✅  Seed complete! 20 matches created and ratings processed.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
