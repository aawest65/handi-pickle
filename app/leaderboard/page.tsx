"use client";

import { useState, useEffect, useCallback } from "react";

const PLAY_TYPES = ["TOURNAMENT", "LEAGUE", "RECREATIONAL"] as const;
const FORMATS = [
  "MENS_SINGLES",
  "MENS_DOUBLES",
  "WOMENS_SINGLES",
  "WOMENS_DOUBLES",
  "MIXED_DOUBLES",
] as const;

type PlayType = (typeof PLAY_TYPES)[number];
type Format = (typeof FORMATS)[number];

const PLAY_TYPE_LABELS: Record<PlayType, string> = {
  TOURNAMENT: "Tournament",
  LEAGUE: "League",
  RECREATIONAL: "Recreational",
};

const FORMAT_LABELS: Record<Format, string> = {
  MENS_SINGLES: "Men's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_SINGLES: "Women's Singles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerGender: string;
  rating: number;
  reliability: number;
  gamesPlayed: number;
  playType: string;
  format: string;
}

function RatingBadge({ rating }: { rating: number }) {
  let color = "text-slate-300";
  if (rating >= 6.0) color = "text-yellow-400";
  else if (rating >= 5.0) color = "text-orange-400";
  else if (rating >= 4.0) color = "text-teal-400";
  else if (rating >= 3.5) color = "text-sky-400";
  return <span className={`font-bold text-lg ${color}`}>{rating.toFixed(2)}</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold">🥇 1</span>;
  if (rank === 2) return <span className="text-slate-300 font-bold">🥈 2</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">🥉 3</span>;
  return <span className="text-slate-400 font-medium">{rank}</span>;
}

export default function LeaderboardPage() {
  const [playType, setPlayType] = useState<PlayType>("RECREATIONAL");
  const [format, setFormat] = useState<Format>("MENS_SINGLES");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/leaderboard?playType=${playType}&format=${format}`
      );
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [playType, format]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Leaderboard</h1>
        <p className="text-slate-400 mt-1">Top players ranked by dynamic rating</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Play Type
          </label>
          <select
            value={playType}
            onChange={(e) => setPlayType(e.target.value as PlayType)}
            className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {PLAY_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {PLAY_TYPE_LABELS[pt]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subtitle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-400">
          {PLAY_TYPE_LABELS[playType]} &mdash; {FORMAT_LABELS[format]}
        </h2>
        {!loading && (
          <span className="text-sm text-slate-500">
            {entries.length} player{entries.length !== 1 ? "s" : ""} ranked
          </span>
        )}
      </div>

      {/* Table */}
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
          <p className="text-lg font-medium text-slate-300">No rankings yet</p>
          <p className="text-sm mt-2">
            Record some matches to start generating ratings for this category.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium w-16">Rank</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Player</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Rating</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Reliability</th>
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
                    <div className="text-xs text-slate-500 mt-0.5">
                      {entry.playerGender === "MALE" ? "Male" : "Female"}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <RatingBadge rating={entry.rating} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-slate-300 font-medium">
                        {Math.round(entry.reliability * 100)}%
                      </span>
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.round(entry.reliability * 100)}%` }}
                        />
                      </div>
                    </div>
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
