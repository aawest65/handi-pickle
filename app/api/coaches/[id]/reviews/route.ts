import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — submit or update a review. Reviewer must be an assigned player of this coach.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Must be a registered player to leave a review" }, { status: 403 });
  }

  const { id: coachProfileId } = await params;
  const playerId = session.user.playerId;

  // Verify this player is assigned to this coach
  const profile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { userId: true },
  });
  if (!profile) return NextResponse.json({ error: "Coach not found" }, { status: 404 });

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { assignedCoachId: true },
  });
  if (player?.assignedCoachId !== profile.userId) {
    return NextResponse.json({ error: "Only assigned players may review this coach" }, { status: 403 });
  }

  const { rating, comment } = await req.json();
  if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be an integer 1–5" }, { status: 400 });
  }

  const review = await prisma.coachReview.upsert({
    where: { coachProfileId_reviewerPlayerId: { coachProfileId, reviewerPlayerId: playerId } },
    create: {
      coachProfileId,
      reviewerPlayerId: playerId,
      rating,
      comment: typeof comment === "string" ? comment.trim() || null : null,
    },
    update: {
      rating,
      comment: typeof comment === "string" ? comment.trim() || null : null,
    },
    include: { reviewerPlayer: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json(review);
}

// DELETE — remove your own review
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: coachProfileId } = await params;
  const playerId = session.user.playerId;

  await prisma.coachReview.deleteMany({
    where: { coachProfileId, reviewerPlayerId: playerId },
  });

  return NextResponse.json({ success: true });
}
