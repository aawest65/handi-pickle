"use client";

import { useState, useEffect, useCallback } from "react";

interface LeaderboardEntry {
  rank:         number;
  playerId:     string;
  playerName:   string;
  playerGender: string;
  playerAge:    number;
  playerCity:   string | null;
  playerState:  string | null;
  rating:       number;
  gamesPlayed:  number;
  category:     string;
}

const CATEGORY_COLOR: Record<string, string> = {
  PRO:          "text-yellow-400",
  ADVANCED:     "text-blue-400",
  INTERMEDIATE: "text-teal-400",
  NOVICE:       "text-slate-300",
};

function RatingBadge({ rating }: { rating: number }) {
  let color = "text-slate-300";
  if (rating >= 6.0) color = "text-yellow-400";
  else if (rating >= 5.0) color = "text-orange-400";
  else if (rating >= 4.5) color = "text-blue-400";
  else if (rating >= 3.5) color = "text-teal-400";
  return <span className={`font-bold text-lg ${color}`}>{rating.toFixed(3)}</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold">🥇 1</span>;
  if (rank === 2) return <span className="text-slate-300 font-bold">🥈 2</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">🥉 3</span>;
  return <span className="text-slate-400 font-medium">{rank}</span>;
}

export default function LeaderboardPage() {
  const [gender, setGender]   = useState<"" | "MALE" | "FEMALE">("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = gender ? `/api/leaderboard?gender=${gender}` : "/api/leaderboard";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      setEntries(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [gender]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Leaderboard</h1>
        <p className="text-slate-400 mt-1">Players ranked by current rating</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-4 mb-8 bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
            className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-400">
          {gender === "MALE" ? "Men" : gender === "FEMALE" ? "Women" : "All Players"}
        </h2>
        {!loading && (
          <span className="text-sm text-slate-500">
            {entries.length} player{entries.length !== 1 ? "s" : ""} ranked
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mr-3" />
          Loading...
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium text-slate-300">No players yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium w-16">Rank</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Player</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Rating</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Games</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={entry.playerId}
                  className={`border-b border-slate-700/50 transition-colors hover:bg-slate-800/50 ${
                    idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-800/20"
                  } ${idx === 0 ? "bg-yellow-900/10" : ""}`}
                >
                  <td className="px-4 py-3.5 text-center">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-200">{entry.playerName}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{entry.playerGender === "MALE" ? "Male" : "Female"}</span>
                      <span>·</span>
                      <span>Age {entry.playerAge}</span>
                      <span className={`font-medium ${CATEGORY_COLOR[entry.category] ?? "text-slate-400"}`}>
                        · {entry.category.charAt(0) + entry.category.slice(1).toLowerCase()}
                      </span>
                      {(entry.playerCity || entry.playerState) && (
                        <span className="ml-1">
                          · {[entry.playerCity, entry.playerState].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <RatingBadge rating={entry.rating} />
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-300 font-medium">
                    {entry.gamesPlayed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
