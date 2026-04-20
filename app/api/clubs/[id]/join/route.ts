import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPlayer(userId: string) {
  return prisma.player.findUnique({
    where: { userId },
    select: { id: true, onboardingComplete: true, clubId: true },
  });
}

// POST — submit a join request (player-initiated); invite-link auto-join uses PUT
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [player, club] = await Promise.all([
    getPlayer(session.user.id),
    prisma.club.findUnique({ where: { id, status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  if (!player.onboardingComplete) return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  if (player.clubId === id) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  // Upsert so re-requesting after rejection creates a fresh PENDING request
  await prisma.clubJoinRequest.upsert({
    where:  { clubId_playerId: { clubId: id, playerId: player.id } },
    create: { clubId: id, playerId: player.id, status: "PENDING" },
    update: { status: "PENDING", requestedAt: new Date(), reviewedAt: null, reviewedById: null },
  });

  return NextResponse.json({ success: true, status: "PENDING" });
}

// PUT — direct join used by the manager-invite flow (/join/[clubId] page)
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [player, club] = await Promise.all([
    getPlayer(session.user.id),
    prisma.club.findUnique({ where: { id, status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  if (!player.onboardingComplete) return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  await prisma.player.update({ where: { id: player.id }, data: { clubId: id } });
  return NextResponse.json({ success: true, clubName: club.name });
}

// DELETE — leave current club
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const player = await getPlayer(session.user.id);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  if (player.clubId !== id) return NextResponse.json({ error: "You are not a member of this club" }, { status: 400 });

  await prisma.player.update({ where: { id: player.id }, data: { clubId: null } });
  return NextResponse.json({ success: true });
}
