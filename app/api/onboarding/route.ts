import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_INITIAL_RATING } from "@/lib/rating/algorithm";
import { generatePlayerNumber } from "@/lib/playerNumber";

// GET — return current player state so wizard can resume
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { player: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    userName: user.name,
    player: user.player,
  });
}

// PUT — save step data
// body: { step: 1, name, dateOfBirth, gender }  dateOfBirth: "YYYY-MM-DD"
//       { step: 2, selfRatedCategory, preferredFormat, yearsPlaying }
//       { step: 3, city, state }  (optional, can pass empty strings to skip)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { player: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { step } = body;

  if (step === 1) {
    const { name, dateOfBirth, gender, showAge } = body as { name: string; dateOfBirth: string; gender: string; showAge?: boolean };

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!["MALE", "FEMALE"].includes(gender)) return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
    const dob = new Date(dateOfBirth);
    if (!dateOfBirth || isNaN(dob.getTime()) || dob >= new Date()) {
      return NextResponse.json({ error: "A valid date of birth is required" }, { status: 400 });
    }

    // Update user name
    await prisma.user.update({ where: { id: user.id }, data: { name: name.trim() } });

    // Create or update stub player
    const player = user.player
      ? await prisma.player.update({
          where: { userId: user.id },
          data: { name: name.trim(), dateOfBirth: dob, gender, ...(showAge !== undefined && { showAge }) },
        })
      : await prisma.player.create({
          data: {
            userId: user.id,
            name: name.trim(),
            dateOfBirth: dob,
            gender,
            showAge: showAge !== false,
            onboardingComplete: false,
            playerNumber: await generatePlayerNumber(name.trim()),
          },
        });

    return NextResponse.json({ player });
  }

  if (step === 2) {
    const { selfRatedCategory, preferredFormat, yearsPlaying } = body as {
      selfRatedCategory: string;
      preferredFormat?: string;
      yearsPlaying?: number;
    };

    if (!user.player) {
      return NextResponse.json({ error: "Complete step 1 first" }, { status: 400 });
    }

    // If onboarding is already complete, skill level and rating are locked —
    // only admins may change those. Only update game preferences.
    if (user.player.onboardingComplete) {
      const player = await prisma.player.update({
        where: { userId: user.id },
        data: {
          preferredFormat: preferredFormat ?? null,
          yearsPlaying: yearsPlaying ?? null,
        },
      });
      return NextResponse.json({ player });
    }

    const validCategories = ["NOVICE", "INTERMEDIATE", "ADVANCED", "PRO"];
    if (!validCategories.includes(selfRatedCategory)) {
      return NextResponse.json({ error: "Invalid skill category" }, { status: 400 });
    }

    const initialRating = CATEGORY_INITIAL_RATING[selfRatedCategory];
    const player = await prisma.player.update({
      where: { userId: user.id },
      data: {
        selfRatedCategory,
        currentRating: initialRating,
        preferredFormat: preferredFormat ?? null,
        yearsPlaying: yearsPlaying ?? null,
      },
    });

    return NextResponse.json({ player });
  }

  if (step === 3) {
    const { city, state, clubId } = body as { city?: string; state?: string; clubId?: string | null };

    if (!user.player) {
      return NextResponse.json({ error: "Complete step 1 first" }, { status: 400 });
    }

    const player = await prisma.player.update({
      where: { userId: user.id },
      data: {
        city: city?.trim() || null,
        state: state?.trim() || null,
        clubId: clubId ?? null,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({ player });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
