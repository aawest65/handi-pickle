import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — public list of all clubs (for dropdowns)
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        description: true,
        logoUrl: true,
        isPrivate: true,
        _count: { select: { memberships: true } },
      },
    });
    return NextResponse.json(clubs);
  } catch (error) {
    console.error("GET /api/clubs error:", error);
    return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
  }
}

// POST — create club (admin+)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, city, state, description } = await req.json() as {
      name: string;
      city?: string;
      state?: string;
      description?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 });
    }

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        city: city?.trim() || null,
        state: state?.trim() || null,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A club with that name already exists" }, { status: 409 });
    }
    console.error("POST /api/clubs error:", error);
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 });
  }
}
