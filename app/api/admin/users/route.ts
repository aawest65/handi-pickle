import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — list all users with player info (ADMIN+)
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { player: { createdAt: "asc" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      player: {
        select: {
          id: true,
          playerNumber: true,
          currentRating: true,
          gamesPlayed: true,
          selfRatedCategory: true,
          onboardingComplete: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}

// PATCH /api/admin/users — update a user's role (SUPER_ADMIN only)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();
  if (!userId || !["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
