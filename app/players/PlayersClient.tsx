"use client";

import { useState } from "react";
import Link from "next/link";
import { ReliabilityBar } from "@/app/components/ReliabilityBar";
import { pickleballAge } from "@/lib/pickleballAge";

interface Player {
  id: string;
  playerNumber: string;
  name: string;
  gender: string;
  dateOfBirth: Date;
  city: string | null;
  state: string | null;
  selfRatedCategory: string;
  currentRating: number;
  gamesPlayed: number;
  showAge: boolean;
}

const CATEGORY_COLOR: Record<string, string> = {
  PRO:          "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  ADVANCED:     "bg-blue-500/20 text-blue-300 border-blue-500/40",
  INTERMEDIATE: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  NOVICE:       "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

export function PlayersClient({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? players.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.playerNumber.toLowerCase().includes(q) ||
          (p.city ?? "").toLowerCase().includes(q) ||
          (p.state ?? "").toLowerCase().includes(q)
        );
      })
    : players;

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

      {/* Result count when searching */}
      {query.trim() && (
        <p className="text-sm text-slate-500 mb-4">
          {filtered.length === 0
            ? "No players match your search"
            : `${filtered.length} player${filtered.length !== 1 ? "s" : ""} found`}
        </p>
      )}

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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-teal-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-teal-900/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-lg font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                      {player.name}
                    </h2>
                    <span className="text-xs text-slate-500">ID: {player.playerNumber}</span>
                  </div>
                  {(player.city || player.state) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[player.city, player.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                      {player.gender === "MALE" ? "Male" : "Female"}
                    </span>
                    {player.showAge && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                        Age {pickleballAge(player.dateOfBirth)}
                      </span>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${CATEGORY_COLOR[player.selfRatedCategory] ?? CATEGORY_COLOR.NOVICE}`}>
                      {player.selfRatedCategory.charAt(0) + player.selfRatedCategory.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-400">
                    {player.currentRating.toFixed(3)}
                  </div>
                  <div className="text-xs text-slate-500">rating</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{player.gamesPlayed} game{player.gamesPlayed !== 1 ? "s" : ""} played</span>
                  <span className="text-slate-500">reliability</span>
                </div>
                <ReliabilityBar gamesPlayed={player.gamesPlayed} compact />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
