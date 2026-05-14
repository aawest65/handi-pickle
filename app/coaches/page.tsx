export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { CoachesClient } from "./CoachesClient";

async function getCoaches() {
  const profiles = await prisma.coachProfile.findMany({
    where: { isPublic: true, user: { isCoach: true } },
    include: {
      user: { select: { id: true, name: true, image: true, player: { select: { avatarUrl: true } } } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return profiles.map((p) => ({
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
    avgRating: p.reviews.length
      ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
      : null,
  }));
}

export default async function CoachesPage() {
  const coaches = await getCoaches();

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Find a Coach</h1>
        <p className="text-slate-400 mt-1">Browse certified pickleball coaches and filter by location or specialty.</p>
      </div>
      <CoachesClient coaches={coaches} />
    </div>
  );
}
