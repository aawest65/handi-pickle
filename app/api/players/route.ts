import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        ratings: true,
      },
      orderBy: { createdAt: "desc" },
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

    const body = await request.json();
    const { name, age, gender } = body as { name: string; age: number; gender: string };

    if (!name || !gender) {
      return NextResponse.json({ error: "Name and gender are required" }, { status: 400 });
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json({ error: "Gender must be MALE or FEMALE" }, { status: 400 });
    }

    if (typeof age !== "number" || isNaN(age) || age < 5 || age > 100) {
      return NextResponse.json({ error: "Age must be a number between 5 and 100" }, { status: 400 });
    }

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
        userId: user.id,
        name,
        age,
        gender,
      },
      include: { ratings: true },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("POST /api/players error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
