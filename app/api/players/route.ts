import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CATEGORY_INITIAL_RATING } from "@/lib/rating/algorithm";
import { generatePlayerNumber } from "@/lib/playerNumber";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { currentRating: "desc" },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error("GET /api/players error:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const VALID_CATEGORIES = ["BEGINNER", "NOVICE", "NOVICE_PLUS", "INTERMEDIATE", "ADVANCED", "ADVANCED_PLUS", "EXPERT", "EXPERT_PLUS", "PRO"] as const;
    type SkillCategory = typeof VALID_CATEGORIES[number];

    const body = await request.json();
    const { name, dateOfBirth, gender, city, state, selfRatedCategory } = body as {
      name: string;
      dateOfBirth: string;
      gender: string;
      city?: string;
      state?: string;
      selfRatedCategory?: string;
    };

    if (!name || !gender) {
      return NextResponse.json({ error: "Name and gender are required" }, { status: 400 });
    }
    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json({ error: "Gender must be MALE or FEMALE" }, { status: 400 });
    }
    const dob = new Date(dateOfBirth);
    if (!dateOfBirth || isNaN(dob.getTime()) || dob >= new Date()) {
      return NextResponse.json({ error: "A valid date of birth is required" }, { status: 400 });
    }
    if (!selfRatedCategory || !VALID_CATEGORIES.includes(selfRatedCategory as SkillCategory)) {
      return NextResponse.json({ error: "A valid skill level is required" }, { status: 400 });
    }

    const category = selfRatedCategory as SkillCategory;
    const initialRating = CATEGORY_INITIAL_RATING[category];

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { player: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.player) {
      return NextResponse.json({ error: "User already has a player profile" }, { status: 409 });
    }

    const player = await prisma.player.create({
      data: {
        userId:             user.id,
        name,
        dateOfBirth:        dob,
        gender,
        city:               city?.trim() || null,
        state:              state?.trim() || null,
        selfRatedCategory:  category,
        initialRating,
        currentRating:      initialRating,
        playerNumber:       await generatePlayerNumber(name),
        sportsmanshipSum:   4.9,  // seeds grade at A until peer ratings come in
        sportsmanshipCount: 1,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("POST /api/players error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
