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

async function createUserAndPlayer(
  firstName: string,
  lastName: string,
  gender: "MALE" | "FEMALE",
  age: number,
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
      age,
      selfRatedCategory: category,
      currentRating:     CATEGORY_INITIAL_RATING[category],
    },
  });

  return player;
}

async function main() {
  console.log("🌱  Starting seed...");

  await createUserAndPlayer("Alex",    "Turner",   "MALE",   28, "PRO");
  await createUserAndPlayer("Marcus",  "Johnson",  "MALE",   35, "ADVANCED");
  await createUserAndPlayer("Derek",   "Chen",     "MALE",   42, "INTERMEDIATE");
  await createUserAndPlayer("Ryan",    "Patel",    "MALE",   51, "NOVICE");
  await createUserAndPlayer("Sarah",   "Williams", "FEMALE", 31, "PRO");
  await createUserAndPlayer("Jessica", "Lee",      "FEMALE", 26, "INTERMEDIATE");
  await createUserAndPlayer("Amanda",  "Brooks",   "FEMALE", 47, "NOVICE");
  await createUserAndPlayer("Priya",   "Sharma",   "FEMALE", 58, "NOVICE");

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
