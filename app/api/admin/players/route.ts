import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_INITIAL_RATING } from "@/lib/rating/algorithm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const VALID_CATEGORIES = ["NOVICE", "INTERMEDIATE", "ADVANCED", "PRO"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

// POST /api/admin/players — create a placeholder User + Player
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, gender, dateOfBirth, selfRatedCategory, email: emailOverride } = body as {
    name: string;
    gender: string;
    dateOfBirth: string;
    selfRatedCategory: string;
    email?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!["MALE", "FEMALE"].includes(gender)) {
    return NextResponse.json({ error: "Gender must be MALE or FEMALE" }, { status: 400 });
  }
  const dob = new Date(dateOfBirth);
  if (!dateOfBirth || isNaN(dob.getTime()) || dob >= new Date()) {
    return NextResponse.json({ error: "A valid date of birth is required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(selfRatedCategory as Category)) {
    return NextResponse.json({ error: "Invalid skill category" }, { status: 400 });
  }

  // Generate a placeholder email from the name if not provided
  let email = emailOverride?.trim();
  if (!email) {
    const slug = name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
    email = `${slug}@example.com`;
    // Ensure uniqueness
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { email } })) {
      email = `${slug}.${suffix}@example.com`;
      suffix++;
    }
  } else if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const password = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
  const category = selfRatedCategory as Category;

  const user = await prisma.user.create({
    data: {
      email,
      name: name.trim(),
      password,
      player: {
        create: {
          name: name.trim(),
          gender,
          dateOfBirth: dob,
          selfRatedCategory: category,
          currentRating: CATEGORY_INITIAL_RATING[category],
          onboardingComplete: true, // admin-created players are immediately active
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      player: { select: { id: true, currentRating: true, selfRatedCategory: true } },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
