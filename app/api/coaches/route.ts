import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profiles = await prisma.coachProfile.findMany({
    where: { isPublic: true, user: { isCoach: true } },
    include: {
      user: { select: { id: true, name: true, image: true, player: { select: { avatarUrl: true, currentRating: true } } } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = profiles.map((p) => {
    const avgRating = p.reviews.length
      ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
      : null;
    return {
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      avatarUrl: p.user.player?.avatarUrl ?? p.user.image ?? null,
      city: p.city,
      state: p.state,
      yearsCoaching: p.yearsCoaching,
      certifications: p.certifications,
      otherCerts: p.otherCerts,
      specialties: p.specialties,
      lessonRateMin: p.lessonRateMin,
      lessonRateMax: p.lessonRateMax,
      groupRate: p.groupRate,
      reviewCount: p.reviews.length,
      avgRating,
    };
  });

  return NextResponse.json(result);
}
