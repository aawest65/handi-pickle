export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CERT_OPTIONS, SPECIALTY_OPTIONS, SPECIALTY_COLORS } from "../constants";
import { ReviewSection } from "./ReviewSection";

async function getProfile(id: string) {
  return prisma.coachProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true, name: true, image: true,
          player: { select: { avatarUrl: true, city: true, state: true } },
        },
      },
      reviews: {
        include: { reviewerPlayer: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

function certLabel(v: string) { return CERT_OPTIONS.find((c) => c.value === v)?.label ?? v; }
function specLabel(v: string) { return SPECIALTY_OPTIONS.find((s) => s.value === v)?.label ?? v; }

function StarsFull({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-5 h-5 ${s <= Math.round(rating) ? "text-yellow-400" : "text-slate-600"}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default async function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, session] = await Promise.all([getProfile(id), auth()]);
  if (!profile || !profile.isPublic) notFound();

  const avgRating = profile.reviews.length
    ? profile.reviews.reduce((s, r) => s + r.rating, 0) / profile.reviews.length
    : null;

  const isOwner = session?.user?.id === profile.userId;
  const viewerPlayerId = session?.user?.playerId ?? null;

  // Can the viewer leave a review? Must be an assigned player of this coach.
  const canReview = viewerPlayerId
    ? (await prisma.player.findUnique({ where: { id: viewerPlayerId }, select: { assignedCoachId: true } }))?.assignedCoachId === profile.userId
    : false;

  const existingReview = viewerPlayerId
    ? profile.reviews.find((r) => r.reviewerPlayer.id === viewerPlayerId) ?? null
    : null;

  const avatarUrl = profile.user.player?.avatarUrl ?? profile.user.image ?? null;
  const city  = profile.city ?? profile.user.player?.city ?? null;
  const state = profile.state ?? profile.user.player?.state ?? null;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">

      {/* Header card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900/60 to-slate-800 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase">Handi-Pickle · Coach Profile</span>
          {isOwner && (
            <Link href="/coaches/me" className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium">
              Edit Profile
            </Link>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-indigo-900 border-2 border-indigo-600 overflow-hidden flex items-center justify-center text-2xl font-bold text-indigo-300 shrink-0 relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={profile.user.name ?? ""} fill className="object-cover" sizes="80px" />
              ) : (
                (profile.user.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-100">{profile.user.name}</h1>
              {(city || state) && (
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  {[city, state].filter(Boolean).join(", ")}
                </p>
              )}
              {profile.yearsCoaching != null && (
                <p className="text-sm text-slate-400 mt-0.5">{profile.yearsCoaching} year{profile.yearsCoaching !== 1 ? "s" : ""} coaching experience</p>
              )}
              {avgRating != null && (
                <div className="flex items-center gap-2 mt-2">
                  <StarsFull rating={avgRating} />
                  <span className="text-sm font-bold text-yellow-400">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">({profile.reviews.length} review{profile.reviews.length !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-5 text-sm text-slate-300 leading-relaxed border-t border-slate-700 pt-4">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Specialties */}
      {profile.specialties.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {profile.specialties.map((s) => (
              <span key={s} className={`px-3 py-1 rounded-full text-sm font-medium border ${SPECIALTY_COLORS[s] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                {specLabel(s)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {(profile.certifications.length > 0 || profile.otherCerts) && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Certifications & Licenses</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.certifications.map((c) => (
              <span key={c} className="px-3 py-1 rounded-lg text-sm font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/40">
                {certLabel(c)}
              </span>
            ))}
          </div>
          {profile.otherCerts && (
            <p className="text-sm text-slate-400 mt-1">{profile.otherCerts}</p>
          )}
        </div>
      )}

      {/* Pricing */}
      {(profile.lessonRateMin || profile.lessonRateMax || profile.groupRate) && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Pricing</h2>
          <div className="space-y-2">
            {(profile.lessonRateMin || profile.lessonRateMax) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Private lesson</span>
                <span className="text-base font-bold text-teal-400">
                  {profile.lessonRateMin && profile.lessonRateMax && profile.lessonRateMin !== profile.lessonRateMax
                    ? `$${profile.lessonRateMin}–$${profile.lessonRateMax}/hr`
                    : `$${profile.lessonRateMin ?? profile.lessonRateMax}/hr`}
                </span>
              </div>
            )}
            {profile.groupRate && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-slate-300">Group / clinic</span>
                <span className="text-sm text-slate-300 text-right">{profile.groupRate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      {(profile.website || (profile.showPhone && profile.phone)) && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Contact</h2>
          <div className="space-y-2">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile.showPhone && profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                {profile.phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Reviews */}
      <ReviewSection
        coachProfileId={profile.id}
        reviews={profile.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          reviewerPlayer: r.reviewerPlayer,
        }))}
        canReview={canReview}
        existingReview={existingReview ? {
          id: existingReview.id,
          rating: existingReview.rating,
          comment: existingReview.comment,
        } : null}
        viewerPlayerId={viewerPlayerId}
      />
    </div>
  );
}
