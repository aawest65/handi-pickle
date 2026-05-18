import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: return the current player's request status for this coach
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const playerId = session?.user?.playerId ?? null;
  if (!playerId) return NextResponse.json({ status: null });

  const { id: coachProfileId } = await params;
  const profile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { userId: true },
  });
  if (!profile) return NextResponse.json({ status: null });

  const req = await prisma.coachRequest.findUnique({
    where: { playerId_coachUserId: { playerId, coachUserId: profile.userId } },
    select: { status: true },
  });

  return NextResponse.json({ status: req?.status ?? null });
}

// POST: player sends a coach request (or re-sends a declined one)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const playerId = session?.user?.playerId ?? null;
  if (!playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: coachProfileId } = await params;
  const profile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { userId: true, isPublic: true },
  });
  if (!profile || !profile.isPublic) {
    return NextResponse.json({ error: "Coach not found" }, { status: 404 });
  }
  if (profile.userId === session!.user.id) {
    return NextResponse.json({ error: "Cannot request yourself" }, { status: 400 });
  }

  const existing = await prisma.coachRequest.findUnique({
    where: { playerId_coachUserId: { playerId, coachUserId: profile.userId } },
    select: { status: true },
  });

  if (existing?.status === "PENDING") {
    return NextResponse.json({ error: "Request already pending" }, { status: 409 });
  }
  if (existing?.status === "ACCEPTED") {
    return NextResponse.json({ error: "Already your coach" }, { status: 409 });
  }

  // Upsert: create fresh or reset a previously declined request
  await prisma.coachRequest.upsert({
    where: { playerId_coachUserId: { playerId, coachUserId: profile.userId } },
    create: { playerId, coachUserId: profile.userId, status: "PENDING" },
    update: { status: "PENDING", requestedAt: new Date(), reviewedAt: null },
  });

  return NextResponse.json({ status: "PENDING" });
}
