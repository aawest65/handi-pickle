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

  const [clubs, setClubs]                   = useState<Club[]>([]);
  const [currentClubId, setCurrentClubId]   = useState<string | null>(null);
  const [pendingClubIds, setPendingClubIds]  = useState<Set<string>>(new Set());
  const [onboarded, setOnboarded]           = useState(false);
  const [playerState, setPlayerState]       = useState<string | null>(null);
  const [loading, setLoading]               = useState(true);
  const [acting, setActing]                 = useState<string | null>(null);
  const [showAll, setShowAll]               = useState(false);
  const [search, setSearch]                 = useState("");

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
        setPlayerState(onboarding.player.state ?? null);
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
      if (res.ok) setPendingClubIds((prev) => new Set([...prev, clubId]));
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

  // Filter by search query
  const q = search.trim().toLowerCase();
  const filtered = q
    ? clubs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.state?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
      )
    : clubs;

  // Split into nearby (same state) and others — only when player has a state and not searching
  const hasLocation = !!playerState && !q;
  const nearby  = hasLocation ? filtered.filter((c) => c.state === playerState) : [];
  const others  = hasLocation ? filtered.filter((c) => c.state !== playerState) : filtered;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
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

      {/* Search */}
      {clubs.length > 0 && (
        <div className="relative mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by club name, city, or state…"
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 pl-10 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-slate-700 rounded-xl">
          <p className="text-slate-400 mb-2">No clubs match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch("")} className="text-teal-400 text-sm hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Nearby clubs (same state) ── */}
          {hasLocation && nearby.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-teal-500 uppercase tracking-widest mb-3">
                In {playerState}
              </p>
              <ClubGrid
                clubs={nearby}
                currentClubId={currentClubId}
                pendingClubIds={pendingClubIds}
                onboarded={onboarded}
                acting={acting}
                status={status}
                onJoin={requestJoin}
                onLeave={leaveClub}
              />
            </section>
          )}

          {/* ── Other clubs ── */}
          {hasLocation && others.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Other States
                </p>
                {!showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-xs text-teal-500 hover:text-teal-400 transition-colors"
                  >
                    Show all ({others.length})
                  </button>
                )}
              </div>
              {showAll ? (
                <ClubGrid
                  clubs={others}
                  currentClubId={currentClubId}
                  pendingClubIds={pendingClubIds}
                  onboarded={onboarded}
                  acting={acting}
                  status={status}
                  onJoin={requestJoin}
                  onLeave={leaveClub}
                />
              ) : (
                <div className="border border-slate-700 rounded-xl px-5 py-4 text-center">
                  <p className="text-sm text-slate-500">
                    {others.length} club{others.length !== 1 ? "s" : ""} in other states
                  </p>
                  <button
                    onClick={() => setShowAll(true)}
                    className="mt-1 text-sm text-teal-500 hover:text-teal-400 transition-colors"
                  >
                    Show all →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── No location set — show everything flat ── */}
          {!hasLocation && (
            <ClubGrid
              clubs={filtered}
              currentClubId={currentClubId}
              pendingClubIds={pendingClubIds}
              onboarded={onboarded}
              acting={acting}
              status={status}
              onJoin={requestJoin}
              onLeave={leaveClub}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable club card grid ──────────────────────────────────────────────────

function ClubGrid({
  clubs, currentClubId, pendingClubIds, onboarded, acting, status, onJoin, onLeave,
}: {
  clubs: Club[];
  currentClubId: string | null;
  pendingClubIds: Set<string>;
  onboarded: boolean;
  acting: string | null;
  status: string;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  return (
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

              {onboarded && (
                <div className="mt-3">
                  {isMember ? (
                    <button
                      onClick={() => onLeave(club.id)}
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
                      onClick={() => onJoin(club.id)}
                      disabled={!!acting}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {isActing ? "Requesting…" : "Request to Join"}
                    </button>
                  )}
                </div>
              )}

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
  );
}
