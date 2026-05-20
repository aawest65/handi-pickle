"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface PendingGame {
  id: string;
  date: string;
  team1Score: number;
  team2Score: number;
  team1Player1: { name: string };
  team1Player2: { name: string } | null;
  team2Player1: { name: string };
  team2Player2: { name: string } | null;
  submittedBy: { name: string | null } | null;
}

export default function PendingApprovalsAlert() {
  const { status } = useSession();
  const [games, setGames] = useState<PendingGame[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/matches/pending")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setGames(d))
      .catch(() => {});
  }, [status]);

  if (games.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <span>⚠</span> You have {games.length} score{games.length !== 1 ? "s" : ""} awaiting your approval
        </h2>
        <div className="space-y-2">
          {games.map((g) => {
            const t1 = [g.team1Player1, g.team1Player2].filter(Boolean).map((p) => p!.name).join(" & ");
            const t2 = [g.team2Player1, g.team2Player2].filter(Boolean).map((p) => p!.name).join(" & ");
            const dateStr = new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <Link
                key={g.id}
                href={`/approve/${g.id}`}
                className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-4 py-3 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{t1} <span className="text-slate-500">vs</span> {t2}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dateStr} · {g.team1Score}–{g.team2Score}
                    {g.submittedBy?.name && <> · by {g.submittedBy.name}</>}
                  </p>
                </div>
                <span className="text-amber-400 text-sm ml-3 shrink-0 group-hover:translate-x-0.5 transition-transform">Review →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
