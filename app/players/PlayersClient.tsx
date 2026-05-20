"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface CategoryRating {
  format: string;
  gameCategory: string;
  rating: number;
  gamesPlayed: number;
}

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
  sportsmanshipSum: number;
  sportsmanshipCount: number;
  categoryRatings: CategoryRating[];
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

// Returns the best rating for a format+category combo (most games played wins for CLUB multi-club)
function getCatRating(ratings: CategoryRating[], format: string, category: string): number | null {
  const matches = ratings.filter((r) => r.format === format && r.gameCategory === category && r.gamesPlayed > 0);
  if (!matches.length) return null;
  return matches.reduce((a, b) => (a.gamesPlayed >= b.gamesPlayed ? a : b)).rating;
}

const NINE_CELLS: { label: string; format: string; cat: string }[] = [
  { label: "RD",  format: "DOUBLES", cat: "REC"    },
  { label: "RMx", format: "MIXED",   cat: "REC"    },
  { label: "RS",  format: "SINGLES", cat: "REC"    },
  { label: "CD",  format: "DOUBLES", cat: "CLUB"   },
  { label: "CMx", format: "MIXED",   cat: "CLUB"   },
  { label: "CS",  format: "SINGLES", cat: "CLUB"   },
  { label: "TD",  format: "DOUBLES", cat: "TOURNEY" },
  { label: "TMx", format: "MIXED",   cat: "TOURNEY" },
  { label: "TS",  format: "SINGLES", cat: "TOURNEY" },
];

function PlayerCard({ player }: { player: Player }) {
  const initials = player.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

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
          {(() => {
            const { sportsmanshipSum: sum, sportsmanshipCount: count } = player;
            const avg = count > 0 ? sum / count : null;
            const grade = avg === null ? "—" : avg >= 4.5 ? "A" : avg >= 3.5 ? "B" : avg >= 2.5 ? "C" : avg >= 1.5 ? "D" : "F";
            const color = grade === "A" ? "border-emerald-500 bg-emerald-900/50 text-emerald-300"
              : grade === "B" ? "border-teal-500 bg-teal-900/50 text-teal-300"
              : grade === "C" ? "border-yellow-500 bg-yellow-900/50 text-yellow-300"
              : grade === "—" ? "border-slate-600 text-slate-500"
              : "border-red-500 bg-red-900/50 text-red-300";
            return (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${color}`}>
                {grade}
              </div>
            );
          })()}
          <p className="text-[9px] text-slate-500 mt-0.5 text-center leading-tight">Sports-<br/>manship</p>
        </div>
      </div>

      {/* Player number */}
      <p className="text-xs text-slate-600">#{player.playerNumber}</p>

      {/* 9-category rating grid */}
      <div className="border-t border-slate-700 pt-3 grid grid-cols-3 gap-x-2 gap-y-1.5">
        {NINE_CELLS.map(({ label, format, cat }) => {
          const val = getCatRating(player.categoryRatings, format, cat);
          return (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">{label}</span>
              <span className={`text-xs font-semibold tabular-nums ${val !== null ? "text-slate-200" : "text-slate-700"}`}>
                {val !== null ? val.toFixed(2) : "—"}
              </span>
            </div>
          );
        })}
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
          <p className="text-xs text-slate-500 mb-3">
            {filtered.length} player{filtered.length !== 1 ? "s" : ""} found
          </p>
          {/* Acronym legend */}
          <div className="mb-4 px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl flex flex-wrap gap-x-4 gap-y-1">
            {[
              { abbr: "RD",  def: "Rec Doubles" },
              { abbr: "RMx", def: "Rec Mixed" },
              { abbr: "RS",  def: "Rec Singles" },
              { abbr: "CD",  def: "Club Doubles" },
              { abbr: "CMx", def: "Club Mixed" },
              { abbr: "CS",  def: "Club Singles" },
              { abbr: "TD",  def: "Tournament Doubles" },
              { abbr: "TMx", def: "Tournament Mixed" },
              { abbr: "TS",  def: "Tournament Singles" },
            ].map(({ abbr, def }) => (
              <span key={abbr} className="text-[10px] text-slate-400 whitespace-nowrap">
                <span className="font-bold text-slate-300">{abbr}</span> = {def}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        </div>
      )}
    </>
  );
}
