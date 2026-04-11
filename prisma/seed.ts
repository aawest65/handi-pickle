/**
 * Seed script for HandiPick.
 *
 * Run with:
 *   npx tsx prisma/seed.ts
 *
 * Creates sample users/players with initial ratings based on selfRatedCategory.
 */

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { CATEGORY_INITIAL_RATING } from "../lib/rating/algorithm";

// birthYear produces a dateOfBirth using the pickleball age rule
function dobFromYear(birthYear: number): Date {
  return new Date(`${birthYear}-06-15`);
}

async function createUserAndPlayer(
  firstName: string,
  lastName: string,
  gender: "MALE" | "FEMALE",
  birthYear: number,
  category: "NOVICE" | "INTERMEDIATE" | "ADVANCED" | "PRO" = "NOVICE"
) {
  const email    = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where:  { email },
    update: {},
    create: { email, name: `${firstName} ${lastName}`, password },
  });

  const player = await prisma.player.upsert({
    where:  { userId: user.id },
    update: {},
    create: {
      userId:            user.id,
      name:              `${firstName} ${lastName}`,
      gender,
      dateOfBirth:       dobFromYear(birthYear),
      selfRatedCategory: category,
      currentRating:     CATEGORY_INITIAL_RATING[category],
    },
  });

  return player;
}

async function main() {
  console.log("🌱  Starting seed...");

  await createUserAndPlayer("Alex",    "Turner",   "MALE",   1998, "PRO");
  await createUserAndPlayer("Marcus",  "Johnson",  "MALE",   1991, "ADVANCED");
  await createUserAndPlayer("Derek",   "Chen",     "MALE",   1984, "INTERMEDIATE");
  await createUserAndPlayer("Ryan",    "Patel",    "MALE",   1975, "NOVICE");
  await createUserAndPlayer("Sarah",   "Williams", "FEMALE", 1995, "PRO");
  await createUserAndPlayer("Jessica", "Lee",      "FEMALE", 2000, "INTERMEDIATE");
  await createUserAndPlayer("Amanda",  "Brooks",   "FEMALE", 1979, "NOVICE");
  await createUserAndPlayer("Priya",   "Sharma",   "FEMALE", 1968, "NOVICE");

  console.log("✅  Seed complete — 8 players created.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
