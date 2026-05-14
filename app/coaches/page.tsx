export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
  const [coaches, session] = await Promise.all([getCoaches(), auth()]);
  const isCoach = (session?.user as { isCoach?: boolean })?.isCoach ?? false;
  const myProfile = isCoach && session?.user?.id
    ? await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    : null;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Find a Coach</h1>
          <p className="text-slate-400 mt-1">Browse certified pickleball coaches and filter by location or specialty.</p>
        </div>
        {isCoach && (
          <Link
            href="/coaches/me"
            className="shrink-0 px-4 py-2 rounded-xl bg-indigo-700/40 border border-indigo-600 text-indigo-300 hover:bg-indigo-700/60 transition-colors text-sm font-medium"
          >
            {myProfile ? "Edit My Profile" : "Set Up My Coach Profile"}
          </Link>
        )}
      </div>

      {isCoach && !myProfile && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-900/30 border border-indigo-700/50 text-sm text-indigo-300 flex items-center justify-between gap-4">
          <span>You&apos;re listed as a coach but haven&apos;t set up your public profile yet.</span>
          <Link href="/coaches/me" className="shrink-0 font-semibold underline hover:text-indigo-200">Set up now →</Link>
        </div>
      )}

      <CoachesClient coaches={coaches} />
    </div>
  );
}
