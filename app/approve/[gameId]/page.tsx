"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

interface GamePlayer { id: string; name: string; avatarUrl: string | null }

interface PendingGame {
  id: string;
  gameType: string;
  format: string;
  date: string;
  maxScore: number;
  team1Score: number;
  team2Score: number;
  status: string;
  team1Player1: GamePlayer;
  team1Player2: GamePlayer | null;
  team2Player1: GamePlayer;
  team2Player2: GamePlayer | null;
  submittedBy: { name: string | null } | null;
}

interface Opponent { id: string; name: string; avatarUrl: string | null }

const GAME_TYPE_LABELS: Record<string, string> = {
  REC: "Recreational", CLUB: "Club",
  TOURNEY_REG: "Tournament", TOURNEY_MEDAL: "Tournament (Medal)",
};
const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button"
            onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="text-2xl transition-transform hover:scale-110 focus:outline-none"
          >
            <span className={display >= star ? "text-amber-400" : "text-slate-600"}>★</span>
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-500 h-4">{display > 0 ? STAR_LABELS[display] : "Tap to rate"}</span>
    </div>
  );
}

function Avatar({ player }: { player: GamePlayer }) {
  const initials = player.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-teal-500/20 flex items-center justify-center shrink-0 relative">
      {player.avatarUrl ? (
        <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" sizes="32px" />
      ) : (
        <span className="text-xs font-bold text-teal-400">{initials}</span>
      )}
    </div>
  );
}

export default function ApprovePage() {
  const router = useRouter();
  const { gameId } = useParams<{ gameId: string }>();

  const [game, setGame] = useState<PendingGame | null>(null);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"review" | "rate" | "disputed" | "done">("review");
  const [acting, setActing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/matches/pending`).then((r) => r.json()),
      fetch(`/api/games/${gameId}/rate`).then((r) => r.json()),
    ]).then(([pending, rateData]) => {
      const found = Array.isArray(pending) ? pending.find((g: PendingGame) => g.id === gameId) : null;
      if (!found) { router.replace("/matches"); return; }
      setGame(found);
      setOpponents(rateData.opponents ?? []);
    }).catch(() => router.replace("/matches"))
      .finally(() => setLoading(false));
  }, [gameId, router]);

  async function handleApprove() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${gameId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setStep(opponents.length > 0 ? "rate" : "done");
    } catch { setError("Network error"); }
    finally { setActing(false); }
  }

  async function handleDispute() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${gameId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispute" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setStep("disputed");
    } catch { setError("Network error"); }
    finally { setActing(false); }
  }

  async function handleRateSubmit() {
    const ratings = opponents
      .filter((o) => scores[o.id] > 0)
      .map((o) => ({ playerId: o.id, score: scores[o.id] }));

    if (ratings.length === 0) { setStep("done"); return; }

    setSubmitting(true);
    try {
      await fetch(`/api/games/${gameId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings }),
      });
    } finally {
      setSubmitting(false);
      setStep("done");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) return null;

  const t1won = game.team1Score > game.team2Score;
  const t1names = [game.team1Player1, game.team1Player2].filter(Boolean) as GamePlayer[];
  const t2names = [game.team2Player1, game.team2Player2].filter(Boolean) as GamePlayer[];
  const allScored = opponents.every((o) => scores[o.id] > 0);

  // Done state
  if (step === "done") {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-teal-400 mb-2">All done!</h1>
        <p className="text-slate-400 text-sm mb-6">Ratings have been applied.</p>
        <button onClick={() => router.push("/leaderboard")} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-sm transition-colors">
          View Leaderboard
        </button>
      </div>
    );
  }

  if (step === "disputed") {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="text-5xl mb-4">🚩</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Dispute Filed</h1>
        <p className="text-slate-400 text-sm mb-6">An admin will review this match and make a final determination.</p>
        <button onClick={() => router.push("/")} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-sm transition-colors">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">

      {/* Match card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500">
            {GAME_TYPE_LABELS[game.gameType] ?? game.gameType} · {game.format === "SINGLES" ? "Singles" : "Doubles"}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {game.submittedBy?.name && (
          <p className="text-xs text-slate-500 mb-3">Submitted by {game.submittedBy.name}</p>
        )}

        <div className="flex items-center gap-3">
          {/* Team 1 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {t1names.map((p) => <Avatar key={p.id} player={p} />)}
            </div>
            <p className="text-sm text-slate-200 truncate">{t1names.map((p) => p.name).join(" & ")}</p>
          </div>

          {/* Score */}
          <div className="text-center shrink-0 px-2">
            <p className="text-xl font-bold">
              <span className={t1won ? "text-teal-400" : "text-slate-400"}>{game.team1Score}</span>
              <span className="text-slate-600 mx-1">–</span>
              <span className={!t1won ? "text-teal-400" : "text-slate-400"}>{game.team2Score}</span>
            </p>
          </div>

          {/* Team 2 */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-1.5 justify-end flex-wrap mb-1">
              {t2names.map((p) => <Avatar key={p.id} player={p} />)}
            </div>
            <p className="text-sm text-slate-200 truncate">{t2names.map((p) => p.name).join(" & ")}</p>
          </div>
        </div>
      </div>

      {step === "review" && (
        <>
          <h1 className="text-xl font-bold text-slate-100 mb-1">Confirm this score?</h1>
          <p className="text-slate-400 text-sm mb-6">
            If the score looks correct, approve it. If something is wrong, file a dispute — an admin will review.
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm mb-4">{error}</div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleApprove}
              disabled={acting}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {acting ? "Approving…" : "Approve Score"}
            </button>
            <button
              onClick={handleDispute}
              disabled={acting}
              className="w-full py-2.5 border border-red-800 hover:bg-red-900/30 text-red-400 disabled:opacity-50 font-semibold rounded-xl transition-colors text-sm"
            >
              {acting ? "…" : "Dispute Score"}
            </button>
          </div>
        </>
      )}

      {step === "rate" && (
        <>
          <h1 className="text-xl font-bold text-slate-100 mb-1">Rate sportsmanship</h1>
          <p className="text-slate-400 text-sm mb-6">How were your opponents?</p>

          <div className="space-y-4 mb-6">
            {opponents.map((opponent) => {
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
                  <StarPicker value={scores[opponent.id] ?? 0} onChange={(v) => setScores((prev) => ({ ...prev, [opponent.id]: v }))} />
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRateSubmit}
              disabled={submitting || !allScored}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 disabled:text-teal-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {submitting ? "Submitting…" : "Submit Ratings"}
            </button>
            <button onClick={() => setStep("done")} disabled={submitting} className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
