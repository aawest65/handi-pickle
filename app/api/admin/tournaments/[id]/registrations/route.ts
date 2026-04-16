import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManage(userId: string, tournamentId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  const { role } = session.user as { role: string };
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const director = await prisma.tournamentDirector.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  });
  return !!director;
}

// POST /api/admin/tournaments/[id]/registrations — add player to roster
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: tournamentId } = await params;
  const userId = (session.user as { id: string }).id ?? "";
  if (!(await canManage(userId, tournamentId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { playerId, seed } = await req.json() as { playerId: string; seed?: number };
  if (!playerId) return NextResponse.json({ error: "playerId is required" }, { status: 400 });

  // Check tournament exists and player exists
  const [tournament, player] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: tournamentId }, select: { maxParticipants: true, _count: { select: { registrations: true } } } }),
    prisma.player.findUnique({ where: { id: playerId }, select: { id: true, name: true } }),
  ]);

  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (!player)     return NextResponse.json({ error: "Player not found" },     { status: 404 });

  if (tournament.maxParticipants && tournament._count.registrations >= tournament.maxParticipants) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 409 });
  }

  try {
    const reg = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        playerId,
        seed:         seed ?? null,
        status:       "CONFIRMED",
        confirmedAt:  new Date(),
      },
      select: {
        id: true,
        status: true,
        seed: true,
        registeredAt: true,
        player: { select: { id: true, name: true, playerNumber: true, currentRating: true, gender: true } },
      },
    });
    return NextResponse.json(reg, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Player is already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add player" }, { status: 500 });
  }
}

// DELETE /api/admin/tournaments/[id]/registrations?playerId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: tournamentId } = await params;
  const userId = (session.user as { id: string }).id ?? "";
  if (!(await canManage(userId, tournamentId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });

  await prisma.tournamentRegistration.deleteMany({ where: { tournamentId, playerId } });
  return NextResponse.json({ success: true });
}
