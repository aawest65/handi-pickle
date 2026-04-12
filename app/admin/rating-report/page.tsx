"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

const GAME_TYPE_LABELS: Record<string, string> = {
  REC:           "Recreational",
  CLUB:          "Club",
  TOURNEY_REG:   "Tournament Regular",
  TOURNEY_MEDAL: "Tournament Medal",
};

interface PlayerOption {
  id: string;
  name: string;
  playerNumber: string;
}

interface RatingHistoryEntry {
  id: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  winLossFactor: number;
  typeFactor: number;
  genderFactor: number;
  ageFactor: number;
  rateTypeFactor: number;
  createdAt: string;
  game: {
    id: string;
    gameType: string;
    format: string;
    date: string;
    team1Score: number;
    team2Score: number;
    team1Player1Id: string;
    team1Player2Id: string | null;
    team2Player1Id: string;
    team2Player2Id: string | null;
    team1Player1: { id: string; name: string };
    team1Player2: { id: string; name: string } | null;
    team2Player1: { id: string; name: string };
    team2Player2: { id: string; name: string } | null;
  };
}

interface ReportData {
  id: string;
  name: string;
  playerNumber: string;
  currentRating: number;
  gamesPlayed: number;
  ratingHistory: RatingHistoryEntry[];
}

function FactorCell({ value }: { value: number }) {
  const color = value > 0 ? "text-teal-400" : value < 0 ? "text-red-400" : "text-slate-500";
  const sign  = value >= 0 ? "+" : "";
  return <td className={`px-3 py-2 text-right text-xs tabular-nums ${color}`}>{sign}{value.toFixed(4)}</td>;
}

export default function RatingReportPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [players, setPlayers]         = useState<PlayerOption[]>([]);
  const [searchQ, setSearchQ]         = useState("");
  const [searching, setSearching]     = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [report, setReport]           = useState<ReportData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  async function searchPlayers(q: string) {
    setSearchQ(q);
    if (!q.trim()) { setPlayers([]); return; }
    setSearching(true);
    try {
      const res  = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setPlayers(
        (data as { player: PlayerOption | null }[])
          .filter((u) => u.player)
          .map((u) => u.player!)
      );
    } finally {
      setSearching(false);
    }
  }

  async function loadReport(playerId: string) {
    setSelectedId(playerId);
    setPlayers([]);
    setSearchQ("");
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/admin/rating-report?playerId=${playerId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load report"); return; }
      setReport(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Access restricted to Super Admins.</p>
        <Link href="/admin" className="text-teal-400 hover:underline text-sm mt-4 inline-block">← Back to Admin</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-slate-400 hover:text-slate-200 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold text-slate-100">Rating Factor Report</h1>
      </div>

      {/* Player search */}
      <div className="relative mb-8 max-w-md">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => searchPlayers(e.target.value)}
          placeholder="Search player by name or ID…"
          className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {searching && <span className="absolute right-3 top-2.5 text-slate-500 text-xs">searching…</span>}
        {players.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => loadReport(p.id)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-slate-200 flex justify-between"
              >
                <span>{p.name}</span>
                <span className="text-slate-500">{p.playerNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading report…</p>}
      {error   && <p className="text-red-400 text-sm">{error}</p>}

      {report && !loading && (
        <>
          {/* Player header */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-100">{report.name}</p>
              <p className="text-sm text-slate-400">{report.playerNumber}</p>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-teal-400">{report.currentRating.toFixed(3)}</div>
                <div className="text-xs text-slate-400">Current Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-200">{report.gamesPlayed}</div>
                <div className="text-xs text-slate-400">Games Played</div>
              </div>
            </div>
          </div>

          {/* Factor table */}
          {report.ratingHistory.length === 0 ? (
            <p className="text-slate-400 text-sm">No game history.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-3 py-3 text-left">Date</th>
                    <th className="px-3 py-3 text-left">Type</th>
                    <th className="px-3 py-3 text-left">Opponents</th>
                    <th className="px-3 py-3 text-right">Score</th>
                    <th className="px-3 py-3 text-right">Before</th>
                    <th className="px-3 py-3 text-right">After</th>
                    <th className="px-3 py-3 text-right">Delta</th>
                    <th className="px-3 py-3 text-right">W/L</th>
                    <th className="px-3 py-3 text-right">Type</th>
                    <th className="px-3 py-3 text-right">Gender</th>
                    <th className="px-3 py-3 text-right">Age</th>
                    <th className="px-3 py-3 text-right">Rate×Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {report.ratingHistory.map((h) => {
                    const g = h.game;
                    const onTeam1  = g.team1Player1Id === report.id || g.team1Player2Id === report.id;
                    const myScore  = onTeam1 ? g.team1Score : g.team2Score;
                    const oppScore = onTeam1 ? g.team2Score : g.team1Score;
                    const won      = myScore > oppScore;
                    const opponents = (onTeam1
                      ? [g.team2Player1, g.team2Player2]
                      : [g.team1Player1, g.team1Player2]
                    ).filter(Boolean);

                    return (
                      <tr key={h.id} className="bg-slate-800/50 hover:bg-slate-800">
                        <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                          {GAME_TYPE_LABELS[g.gameType] ?? g.gameType}
                          <span className="text-slate-500 text-xs ml-1">{g.format === "SINGLES" ? "S" : "D"}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-300 text-xs">
                          {opponents.map((p, i) => (
                            <span key={p!.id}>
                              {i > 0 && <span className="text-slate-600"> & </span>}
                              {p!.name}
                            </span>
                          ))}
                        </td>
                        <td className={`px-3 py-2 text-right text-xs font-bold tabular-nums ${won ? "text-teal-400" : "text-red-400"}`}>
                          {myScore}–{oppScore} {won ? "W" : "L"}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-slate-400 tabular-nums">{h.ratingBefore.toFixed(3)}</td>
                        <td className="px-3 py-2 text-right text-xs text-slate-300 tabular-nums">{h.ratingAfter.toFixed(3)}</td>
                        <FactorCell value={h.delta} />
                        <FactorCell value={h.winLossFactor} />
                        <FactorCell value={h.typeFactor} />
                        <FactorCell value={h.genderFactor} />
                        <FactorCell value={h.ageFactor} />
                        <FactorCell value={h.rateTypeFactor} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
