import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id, status: "ACTIVE" },
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
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  return NextResponse.json(club);
}
