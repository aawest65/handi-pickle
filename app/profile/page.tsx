"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { pickleballAge } from "@/lib/pickleballAge";
import { ReliabilityBar } from "@/app/components/ReliabilityBar";

interface PlayerProfile {
  playerNumber: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  city: string | null;
  state: string | null;
  selfRatedCategory: string;
  currentRating: number;
  gamesPlayed: number;
  singlesRating: number;
  doublesRating: number;
  mixedRating: number;
  singlesGamesPlayed: number;
  doublesGamesPlayed: number;
  mixedGamesPlayed: number;
  dominantHand: string | null;
  yearsPlaying: number | null;
  preferredFormat: string | null;
  showAge: boolean;
  avatarUrl: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [savingAge, setSavingAge] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        setPlayer(d.player ?? null);
        if (d.player) {
          setShowAge(d.player.showAge ?? true);
          setAvatarUrl(d.player.avatarUrl ?? null);
        }
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setAvatarError(data.error ?? "Upload failed"); return; }
      setAvatarUrl(data.avatarUrl);
    } catch {
      setAvatarError("Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) setAvatarUrl(null);
    } catch {
      setAvatarError("Failed to remove photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="relative group">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-teal-500 bg-teal-500/20 flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Change profile photo"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={player.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <span className="text-2xl font-bold text-teal-400">{initials}</span>
            )}
            {/* Hover overlay */}
            <span className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              {uploadingAvatar ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </span>
          </button>
          {avatarUrl && !uploadingAvatar && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 border border-slate-900 flex items-center justify-center transition-colors"
              aria-label="Remove profile photo"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />
        {avatarError && (
          <p className="text-xs text-red-400">{avatarError}</p>
        )}
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-100">{player.name}</h1>
          <p className="text-sm text-slate-400">
            {player.city && player.state ? `${player.city}, ${player.state}` : player.city ?? player.state ?? "Location not set"}
          </p>
          <p className="text-xs text-slate-600 mt-1">ID: {player.playerNumber}</p>
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

      {/* Per-format ratings */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Singles",       rating: player.singlesRating, games: player.singlesGamesPlayed },
          { label: "Doubles",       rating: player.doublesRating, games: player.doublesGamesPlayed },
          { label: "Mixed",         rating: player.mixedRating,   games: player.mixedGamesPlayed   },
        ].map(({ label, rating, games }) => (
          <div key={label} className="bg-slate-900 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            {games === 0 ? (
              <p className="text-xl font-bold text-slate-600">—</p>
            ) : (
              <>
                <p className="text-xl font-bold text-teal-400">{rating.toFixed(3)}</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-1.5">{games} game{games !== 1 ? "s" : ""}</p>
                <ReliabilityBar gamesPlayed={games} compact />
              </>
            )}
          </div>
        ))}
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
        href="/onboarding?edit=1"
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
