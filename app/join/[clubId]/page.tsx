"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface ClubInfo {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  logoUrl: string | null;
  _count: { players: number };
}

export default function JoinClubPage() {
  const { clubId }                        = useParams<{ clubId: string }>();
  const { data: session, status }         = useSession();
  const router                            = useRouter();

  const [club, setClub]         = useState<ClubInfo | null>(null);
  const [clubError, setClubError] = useState("");
  const [joining, setJoining]   = useState(false);
  const [joined, setJoined]     = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (!clubId) return;
    fetch(`/api/clubs/${clubId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setClubError("This club link is no longer valid.");
        else setClub(d);
      })
      .catch(() => setClubError("Could not load club info."));
  }, [clubId]);

  // Logged-in but not onboarded → send to onboarding with club pre-selected
  useEffect(() => {
    if (status === "authenticated" && session && !session.user.onboardingComplete) {
      router.replace(`/onboarding?club=${clubId}`);
    }
  }, [status, session, clubId, router]);

  async function handleJoin() {
    setJoining(true);
    setJoinError("");
    try {
      const res  = await fetch(`/api/clubs/${clubId}/join`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error ?? "Failed to join club"); return; }
      setJoined(true);
    } finally {
      setJoining(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && !session?.user?.onboardingComplete)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 mb-4">{clubError}</p>
        <Link href="/" className="text-teal-400 hover:underline text-sm">Go to HandiPick</Link>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (joined) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-900/40 border border-teal-600 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">You&apos;re in!</h1>
        <p className="text-slate-400 text-sm mb-8">You&apos;ve joined <span className="text-slate-200 font-medium">{club.name}</span>.</p>
        <Link href="/" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const location = [club.city, club.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* HandiPick brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-teal-400">HandiPick</h1>
          <p className="text-slate-500 text-sm mt-1">Pickleball Player Ratings</p>
        </div>

        {/* Club card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6 text-center">
          {club.logoUrl && (
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-600 bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <Image src={club.logoUrl} alt={`${club.name} logo`} width={80} height={80} className="w-full h-full object-contain" />
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-100">{club.name}</h2>
          {location && <p className="text-slate-400 text-sm mt-1">{location}</p>}
          <p className="text-slate-500 text-xs mt-1">{club._count.players} member{club._count.players !== 1 ? "s" : ""}</p>
          {club.description && (
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">{club.description}</p>
          )}
        </div>

        {/* CTA */}
        {status === "unauthenticated" ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-slate-400 text-sm mb-1">Create an account to join this club</p>
            <Link
              href={`/register?club=${clubId}`}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-base transition-colors text-center"
            >
              Create Account &amp; Join
            </Link>
            <Link
              href={`/login?club=${clubId}`}
              className="w-full py-3 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-100 font-medium rounded-2xl text-sm transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl text-base transition-colors"
            >
              {joining ? "Joining…" : `Join ${club.name}`}
            </button>
            <Link href="/" className="text-center text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Not now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
