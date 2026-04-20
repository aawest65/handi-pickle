import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — list users with player info (ADMIN+)
// ?q=  search by name, email, or player ID (case-insensitive, partial match)
// ?limit=  max results (default 100)
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q     = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

  const where = q
    ? {
        OR: [
          { name:  { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { player: { playerNumber: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const users = await prisma.user.findMany({
    where,
    orderBy: { player: { createdAt: "asc" } },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isClubAdmin: true,
      isTournamentDirector: true,
      player: {
        select: {
          id: true,
          playerNumber: true,
          currentRating: true,
          initialRating: true,
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
