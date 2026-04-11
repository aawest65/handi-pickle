import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

async function requireSuperAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || token.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/users — list all users with player info
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
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
  const forbidden = await requireSuperAdmin(req);
  if (forbidden) return forbidden;

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
