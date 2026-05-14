import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.coachProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          player: { select: { avatarUrl: true, currentRating: true, city: true, state: true } },
        },
      },
      reviews: {
        include: {
          reviewerPlayer: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile || !profile.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const avgRating = profile.reviews.length
    ? profile.reviews.reduce((s, r) => s + r.rating, 0) / profile.reviews.length
    : null;

  return NextResponse.json({ ...profile, avgRating });
}
