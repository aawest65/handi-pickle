import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/clubs/[id]/members — add a player directly to the club (SUPER_ADMIN only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as { playerId?: string };
  const { playerId } = body;

  if (!playerId) return NextResponse.json({ error: "playerId is required" }, { status: 400 });

  const [player, club] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId }, select: { id: true } }),
    prisma.club.findUnique({ where: { id }, select: { id: true } }),
  ]);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  if (!club)   return NextResponse.json({ error: "Club not found" },   { status: 404 });

  const existing = await prisma.playerClub.findUnique({
    where: { playerId_clubId: { playerId, clubId: id } },
  });
  if (existing) return NextResponse.json({ error: "Player is already a member" }, { status: 409 });

  const membershipCount = await prisma.playerClub.count({ where: { playerId } });

  await prisma.playerClub.create({
    data: { playerId, clubId: id, isPrimary: membershipCount === 0 },
  });

  return NextResponse.json({ success: true });
}
