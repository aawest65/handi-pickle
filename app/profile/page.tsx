"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pickleballAge } from "@/lib/pickleballAge";

interface PlayerProfile {
  playerNumber: number;
  name: string;
  gender: string;
  dateOfBirth: string;
  city: string | null;
  state: string | null;
  selfRatedCategory: string;
  currentRating: number;
  gamesPlayed: number;
  dominantHand: string | null;
  yearsPlaying: number | null;
  preferredFormat: string | null;
  showAge: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [savingAge, setSavingAge] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        setPlayer(d.player ?? null);
        if (d.player) setShowAge(d.player.showAge ?? true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-400">No player profile found.</p>
        <Link href="/onboarding" className="px-4 py-2 bg-teal-500 text-slate-950 rounded-lg font-semibold">
          Complete Setup
        </Link>
      </div>
    );
  }

  const initials = player.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-20 h-20 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center">
          <span className="text-2xl font-bold text-teal-400">{initials}</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-100">{player.name}</h1>
          <p className="text-sm text-slate-400">
            {player.city && player.state ? `${player.city}, ${player.state}` : player.city ?? player.state ?? "Location not set"}
          </p>
          <p className="text-xs text-slate-600 mt-1">Player #{player.playerNumber}</p>
        </div>
      </div>

      {/* Rating card */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Rating</p>
          <p className="text-4xl font-bold text-teal-400">{player.currentRating.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Games Played</p>
          <p className="text-4xl font-bold text-slate-100">{player.gamesPlayed}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-4 space-y-3">
        <Detail label="Skill Level" value={player.selfRatedCategory} />
        <Detail label="Preferred Format" value={player.preferredFormat ?? "—"} />
        <Detail label="Dominant Hand" value={player.dominantHand ?? "—"} />
        <Detail label="Years Playing" value={player.yearsPlaying != null ? `${player.yearsPlaying} yr${player.yearsPlaying !== 1 ? "s" : ""}` : "—"} />
        <Detail label="Age (pickleball)" value={String(pickleballAge(player.dateOfBirth))} />
        <Detail label="Gender" value={player.gender} />
      </div>

      {/* Privacy settings */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Privacy</h2>
        <label className="flex items-center justify-between gap-3 cursor-pointer group">
          <span className="text-sm text-slate-300">Show my age on public profile</span>
          <button
            role="switch"
            aria-checked={showAge}
            disabled={savingAge}
            onClick={async () => {
              const next = !showAge;
              setSavingAge(true);
              setShowAge(next);
              await fetch("/api/profile/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ showAge: next }),
              });
              setSavingAge(false);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${showAge ? "bg-teal-600" : "bg-slate-600"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAge ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </label>
      </div>

      <Link
        href="/onboarding"
        className="block w-full text-center py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
      >
        Edit Profile
      </Link>

      <p className="mt-4 text-center text-xs text-slate-600">
        Signed in as {session?.user?.email}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}
