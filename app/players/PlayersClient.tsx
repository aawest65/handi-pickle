"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  avatarUrl: string | null;
  singlesRating: number;
  doublesRating: number;
  mixedRating: number;
  singlesGamesPlayed: number;
  doublesGamesPlayed: number;
  mixedGamesPlayed: number;
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

function categoryLabel(c: string) {
  return c.charAt(0) + c.slice(1).toLowerCase().replace("_plus", "+").replace("_", " ");
}

function RatingStat({ label, value, played }: { label: string; value: number; played: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</span>
      {played > 0 ? (
        <span className="text-sm font-bold text-slate-100">{value.toFixed(2)}</span>
      ) : (
        <span className="text-sm text-slate-600">—</span>
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  const initials = player.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const doublesLabel = player.gender === "MALE" ? "Men's Dbl" : "Women's Dbl";

  return (
    <Link
      href={`/players/${player.id}`}
      className="bg-slate-800 border border-slate-700 hover:border-teal-600 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-teal-900/20 group"
    >
      {/* Header: avatar + name + rating */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-900 border-2 border-emerald-700 overflow-hidden flex items-center justify-center text-base font-bold text-emerald-300 shrink-0 relative">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" sizes="48px" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 group-hover:text-teal-300 transition-colors truncate">{player.name}</p>
          {(player.city || player.state) && (
            <p className="text-xs text-slate-500 truncate">{[player.city, player.state].filter(Boolean).join(", ")}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-teal-400 tabular-nums">{player.currentRating.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">{player.gamesPlayed}g played</p>
        </div>
      </div>

      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${CATEGORY_COLOR[player.selfRatedCategory] ?? CATEGORY_COLOR.NOVICE}`}>
          {categoryLabel(player.selfRatedCategory)}
        </span>
        <span className="text-xs text-slate-600">#{player.playerNumber}</span>
      </div>

      {/* Per-format ratings */}
      <div className="border-t border-slate-700 pt-3 grid grid-cols-3 gap-2">
        <RatingStat label="Singles"    value={player.singlesRating} played={player.singlesGamesPlayed} />
        <RatingStat label={doublesLabel} value={player.doublesRating} played={player.doublesGamesPlayed} />
        <RatingStat label="Mixed"      value={player.mixedRating}   played={player.mixedGamesPlayed} />
      </div>
    </Link>
  );
}

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
    : [];

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

      {!query.trim() ? (
        <div className="text-center py-24 text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <p className="text-slate-400 font-medium">Search for a player</p>
          <p className="text-sm mt-1">by name, player ID, city, or state</p>
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
        <div>
          <p className="text-xs text-slate-500 mb-4">
            {filtered.length} player{filtered.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        </div>
      )}
    </>
  );
}
