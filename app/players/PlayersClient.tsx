"use client";

import { useState } from "react";
import Link from "next/link";

interface Player {
  id: string;
  playerNumber: string;
  name: string;
  gender: string;
  city: string | null;
  state: string | null;
  selfRatedCategory: string;
  currentRating: number;
  gamesPlayed: number;
  showAge: boolean;
  dateOfBirth: Date;
}

const CATEGORY_COLOR: Record<string, string> = {
  PRO:           "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  EXPERT_PLUS:   "bg-orange-500/20 text-orange-300 border-orange-500/40",
  EXPERT:        "bg-purple-500/20 text-purple-300 border-purple-500/40",
  ADVANCED_PLUS: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  ADVANCED:      "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  INTERMEDIATE:  "bg-teal-500/20 text-teal-300 border-teal-500/40",
  NOVICE_PLUS:   "bg-green-500/20 text-green-300 border-green-500/40",
  NOVICE:        "bg-slate-500/20 text-slate-300 border-slate-500/40",
  BEGINNER:      "bg-slate-600/20 text-slate-400 border-slate-600/40",
};

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

export function PlayersClient({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");

  const sorted = [...players].sort((a, b) =>
    lastName(a.name).localeCompare(lastName(b.name))
  );

  const filtered = query.trim()
    ? sorted.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.playerNumber.toLowerCase().includes(q) ||
          (p.city ?? "").toLowerCase().includes(q) ||
          (p.state ?? "").toLowerCase().includes(q)
        );
      })
    : sorted;

  // Group by first letter of last name (only when not searching)
  const grouped: { letter: string; players: Player[] }[] = [];
  if (!query.trim()) {
    for (const player of filtered) {
      const letter = (lastName(player.name)[0] ?? "#").toUpperCase();
      const last = grouped[grouped.length - 1];
      if (last && last.letter === letter) {
        last.players.push(player);
      } else {
        grouped.push({ letter, players: [player] });
      }
    }
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ID, or location…"
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 && !query.trim() ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-lg font-medium text-slate-300">No players yet</p>
          <p className="text-sm mt-2">Players are created when users register and set up a profile.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-300 font-medium">No players match &ldquo;{query}&rdquo;</p>
          <button onClick={() => setQuery("")} className="mt-3 text-sm text-teal-400 hover:underline">
            Clear search
          </button>
        </div>
      ) : query.trim() ? (
        /* Flat list when searching */
        <div className="border border-slate-700 rounded-xl overflow-hidden">
          <p className="text-xs text-slate-500 px-4 py-2 border-b border-slate-700 bg-slate-800/60">
            {filtered.length} player{filtered.length !== 1 ? "s" : ""} found
          </p>
          <PlayerList players={filtered} />
        </div>
      ) : (
        /* Grouped A-Z list */
        <div className="space-y-6">
          {grouped.map(({ letter, players: group }) => (
            <div key={letter}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1 px-1">
                {letter}
              </div>
              <div className="border border-slate-700 rounded-xl overflow-hidden">
                <PlayerList players={group} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PlayerList({ players }: { players: Player[] }) {
  return (
    <ul className="divide-y divide-slate-700/60">
      {players.map((player) => (
        <li key={player.id}>
          <Link
            href={`/players/${player.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-slate-100 group-hover:text-teal-300 transition-colors truncate">
                {player.name}
              </span>
              <span
                className={`hidden sm:inline-block shrink-0 px-2 py-0.5 rounded text-xs font-semibold border ${CATEGORY_COLOR[player.selfRatedCategory] ?? CATEGORY_COLOR.NOVICE}`}
              >
                {player.selfRatedCategory.charAt(0) + player.selfRatedCategory.slice(1).toLowerCase()}
              </span>
              {(player.city || player.state) && (
                <span className="hidden md:inline text-xs text-slate-500 truncate">
                  {[player.city, player.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-3">
              <span className="text-sm font-bold text-teal-400">{player.currentRating.toFixed(3)}</span>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
