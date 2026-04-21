import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPlayer(userId: string) {
  return prisma.player.findUnique({
    where: { userId },
    select: {
      id: true,
      onboardingComplete: true,
      memberships: { select: { clubId: true, isPrimary: true } },
    },
  });
}

// POST — join open club directly, or submit join request for private club
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [player, club] = await Promise.all([
    getPlayer(session.user.id),
    prisma.club.findUnique({ where: { id, status: "ACTIVE" }, select: { id: true, name: true, isPrivate: true } }),
  ]);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  if (!player.onboardingComplete) return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  if (player.memberships.some((m) => m.clubId === id)) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  if (!club.isPrivate) {
    const isFirst = player.memberships.length === 0;
    await prisma.playerClub.create({
      data: { playerId: player.id, clubId: id, isPrimary: isFirst },
    });
    return NextResponse.json({ success: true, joined: true, clubName: club.name });
  }

  // Private club — create or refresh join request
  await prisma.clubJoinRequest.upsert({
    where:  { clubId_playerId: { clubId: id, playerId: player.id } },
    create: { clubId: id, playerId: player.id, status: "PENDING" },
    update: { status: "PENDING", requestedAt: new Date(), reviewedAt: null, reviewedById: null },
  });

  return NextResponse.json({ success: true, joined: false, status: "PENDING" });
}

// PUT — direct join via invite link (always succeeds for active clubs)
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

  if (!player.memberships.some((m) => m.clubId === id)) {
    const isFirst = player.memberships.length === 0;
    await prisma.playerClub.create({
      data: { playerId: player.id, clubId: id, isPrimary: isFirst },
    });
  }

  return NextResponse.json({ success: true, clubName: club.name });
}

// PATCH — set a club as the player's primary club
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const player = await getPlayer(session.user.id);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  if (!player.memberships.some((m) => m.clubId === id)) {
    return NextResponse.json({ error: "You are not a member of this club" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.playerClub.updateMany({
      where: { playerId: player.id },
      data:  { isPrimary: false },
    }),
    prisma.playerClub.update({
      where: { playerId_clubId: { playerId: player.id, clubId: id } },
      data:  { isPrimary: true },
    }),
  ]);

  return NextResponse.json({ success: true });
}

// DELETE — leave a specific club
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const player = await getPlayer(session.user.id);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  const membership = player.memberships.find((m) => m.clubId === id);
  if (!membership) return NextResponse.json({ error: "You are not a member of this club" }, { status: 400 });

  await prisma.playerClub.delete({
    where: { playerId_clubId: { playerId: player.id, clubId: id } },
  });

  // Promote another club to primary if we left the primary
  if (membership.isPrimary) {
    const next = await prisma.playerClub.findFirst({ where: { playerId: player.id } });
    if (next) {
      await prisma.playerClub.update({
        where: { playerId_clubId: { playerId: player.id, clubId: next.clubId } },
        data:  { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
