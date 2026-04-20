"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Club {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  logoUrl: string | null;
  _count: { players: number };
}

export default function ClubsPage() {
  const { data: session, status } = useSession();

  const [clubs, setClubs]                 = useState<Club[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [pendingClubIds, setPendingClubIds] = useState<Set<string>>(new Set());
  const [onboarded, setOnboarded]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [acting, setActing]               = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then(setClubs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/onboarding").then((r) => r.json()),
      fetch("/api/clubs/join-requests").then((r) => r.json()),
    ]).then(([onboarding, joinReqs]) => {
      if (onboarding.player?.onboardingComplete) {
        setOnboarded(true);
        setCurrentClubId(onboarding.player.clubId ?? null);
      }
      if (Array.isArray(joinReqs)) {
        setPendingClubIds(
          new Set(joinReqs.filter((r: { status: string }) => r.status === "PENDING").map((r: { clubId: string }) => r.clubId))
        );
      }
    }).catch(() => {});
  }, [status]);

  async function requestJoin(clubId: string) {
    setActing(clubId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
      if (res.ok) {
        setPendingClubIds((prev) => new Set([...prev, clubId]));
      }
    } finally {
      setActing(null);
    }
  }

  async function leaveClub(clubId: string) {
    setActing(clubId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/join`, { method: "DELETE" });
      if (res.ok) {
        setCurrentClubId(null);
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId ? { ...c, _count: { players: c._count.players - 1 } } : c
          )
        );
      }
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Clubs</h1>
          <p className="text-slate-400 mt-1">
            {clubs.length} registered club{clubs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clubs/request"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Request a Club
        </Link>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-20 border border-slate-700 rounded-xl">
          <p className="text-lg font-medium text-slate-300 mb-2">No clubs yet</p>
          <p className="text-slate-500 text-sm mb-6">Be the first to establish a club.</p>
          <Link
            href="/clubs/request"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Request a Club
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map((club) => {
            const isMember  = currentClubId === club.id;
            const isPending = !isMember && pendingClubIds.has(club.id);
            const isActing  = acting === club.id;

            return (
              <div
                key={club.id}
                className={`bg-slate-800 border rounded-xl p-5 flex items-start gap-4 transition-colors ${
                  isMember ? "border-teal-600" : "border-slate-700"
                }`}
              >
                {/* Logo */}
                {club.logoUrl ? (
                  <img
                    src={club.logoUrl}
                    alt={`${club.name} logo`}
                    className="w-14 h-14 rounded-lg object-contain bg-slate-700 border border-slate-600 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-700 border border-slate-600 shrink-0 flex items-center justify-center text-slate-500 text-xl font-bold">
                    {club.name.charAt(0)}
                  </div>
                )}

                {/* Info + action */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-slate-100 truncate">{club.name}</h2>
                    {isMember && (
                      <span className="shrink-0 text-xs font-semibold text-teal-400 border border-teal-700 rounded-full px-2 py-0.5">
                        My Club
                      </span>
                    )}
                  </div>
                  {(club.city || club.state) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[club.city, club.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {club.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{club.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {club._count.players} member{club._count.players !== 1 ? "s" : ""}
                  </p>

                  {/* Action button — only for onboarded players */}
                  {onboarded && (
                    <div className="mt-3">
                      {isMember ? (
                        <button
                          onClick={() => leaveClub(club.id)}
                          disabled={!!acting}
                          className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                        >
                          {isActing ? "Leaving…" : "Leave club"}
                        </button>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Request pending
                        </span>
                      ) : (
                        <button
                          onClick={() => requestJoin(club.id)}
                          disabled={!!acting}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          {isActing ? "Requesting…" : "Request to Join"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Prompt unauthenticated / not onboarded users */}
                  {status === "unauthenticated" && (
                    <p className="mt-3 text-xs text-slate-600">
                      <Link href={`/join/${club.id}`} className="text-teal-500 hover:text-teal-400">
                        Sign up to join →
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
