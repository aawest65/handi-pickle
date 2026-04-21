"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

interface Opponent {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="text-2xl transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} star`}
          >
            <span className={display >= star ? "text-amber-400" : "text-slate-600"}>★</span>
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-500 h-4">{display > 0 ? STAR_LABELS[display] : "Tap to rate"}</span>
    </div>
  );
}

export default function RatePage() {
  const router = useRouter();
  const { gameId } = useParams<{ gameId: string }>();

  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [alreadyRated, setAlreadyRated] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gamePending, setGamePending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/games/${gameId}/rate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { router.replace("/leaderboard"); return; }
        setOpponents(d.opponents);
        setAlreadyRated(new Set(d.alreadyRated));
        setGamePending(d.gameStatus !== "APPROVED");
      })
      .catch(() => router.replace("/leaderboard"))
      .finally(() => setLoading(false));
  }, [gameId, router]);

  const unrated = opponents.filter((o) => !alreadyRated.has(o.id));
  const allScored = unrated.every((o) => scores[o.id] > 0);

  async function handleSubmit() {
    const ratings = unrated
      .filter((o) => scores[o.id] > 0)
      .map((o) => ({ playerId: o.id, score: scores[o.id] }));

    if (ratings.length === 0) { router.push("/leaderboard"); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to submit ratings");
        return;
      }
      router.push("/leaderboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // All opponents already rated — skip straight through
  if (unrated.length === 0) {
    router.replace("/leaderboard");
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{gamePending ? "⏳" : "🎉"}</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          {gamePending ? "Score Submitted!" : "Game Recorded!"}
        </h1>
        {gamePending ? (
          <div className="mt-2 space-y-1">
            <p className="text-slate-400 text-sm">Your opponents have 7 days to confirm the score.</p>
            <p className="text-slate-500 text-xs">Ratings are applied once the game is approved.</p>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Ratings updated.</p>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {unrated.map((opponent) => {
          const initials = opponent.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={opponent.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 bg-teal-500/20 flex items-center justify-center shrink-0 relative">
                  {opponent.avatarUrl ? (
                    <Image src={opponent.avatarUrl} alt={opponent.name} fill className="object-cover" sizes="40px" />
                  ) : (
                    <span className="text-sm font-bold text-teal-400">{initials}</span>
                  )}
                </div>
                <span className="font-medium text-slate-200">{opponent.name}</span>
              </div>
              <StarPicker
                value={scores[opponent.id] ?? 0}
                onChange={(v) => setScores((prev) => ({ ...prev, [opponent.id]: v }))}
              />
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !allScored}
          className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 disabled:text-teal-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {submitting ? "Submitting…" : "Submit Ratings"}
        </button>
        <button
          onClick={() => router.push("/leaderboard")}
          disabled={submitting}
          className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
