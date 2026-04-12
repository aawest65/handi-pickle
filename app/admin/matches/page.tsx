"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const GAME_TYPE_LABELS: Record<string, string> = {
  REC:           "Rec",
  CLUB:          "Club",
  TOURNEY_REG:   "Tourney",
  TOURNEY_MEDAL: "Tourney (Medal)",
};

interface GamePlayer {
  id:   string;
  name: string;
}

interface Game {
  id:             string;
  gameType:       string;
  format:         string;
  isMixed:        boolean;
  date:           string;
  maxScore:       number;
  team1Score:     number;
  team2Score:     number;
  team1Player1:   GamePlayer;
  team1Player2:   GamePlayer | null;
  team2Player1:   GamePlayer;
  team2Player2:   GamePlayer | null;
  ratingHistory:  { id: string }[];
}

function formatLabel(game: Game) {
  if (game.format === "SINGLES") return "Singles";
  return game.isMixed ? "Mixed" : "Doubles";
}

function teamNames(p1: GamePlayer, p2: GamePlayer | null) {
  return p2 ? `${p1.name} & ${p2.name}` : p1.name;
}

export default function AdminMatchesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [games, setGames]           = useState<Game[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [players, setPlayers]       = useState<{ id: string; name: string; playerNumber: string }[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadGames();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  async function loadGames(playerId?: string) {
    setLoading(true);
    try {
      const url = playerId
        ? `/api/matches?playerId=${playerId}`
        : "/api/matches";
      const res  = await fetch(url);
      const data = await res.json();
      setGames(data);
    } finally {
      setLoading(false);
    }
  }

  async function searchPlayers(q: string) {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setPlayers([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        setPlayers(
          (data as { player: { id: string; name: string; playerNumber: string } | null }[])
            .filter((u) => u.player)
            .map((u) => u.player!)
        );
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function selectPlayer(p: { id: string; name: string; playerNumber: string }) {
    setSelectedPlayer({ id: p.id, name: p.name });
    setSearch(p.name);
    setPlayers([]);
    loadGames(p.id);
  }

  function clearFilter() {
    setSelectedPlayer(null);
    setSearch("");
    setPlayers([]);
    loadGames();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/matches/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setDeleteError(d.error ?? "Failed to delete match");
        return;
      }
      setGames((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Network error");
    } finally {
      setDeleting(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Access restricted to Super Admins.</p>
        <Link href="/admin" className="text-teal-400 hover:underline text-sm mt-4 inline-block">
          ← Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-slate-400 hover:text-slate-200 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold text-slate-100">Match Management</h1>
      </div>

      {/* Player filter */}
      <div className="relative mb-6 max-w-md">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => searchPlayers(e.target.value)}
              placeholder="Filter by player name…"
              className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searching && (
              <span className="absolute right-3 top-2.5 text-slate-500 text-xs">searching…</span>
            )}
          </div>
          {selectedPlayer && (
            <button
              onClick={clearFilter}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {players.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPlayer(p)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-slate-200 flex justify-between"
              >
                <span>{p.name}</span>
                <span className="text-slate-500">{p.playerNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <p className="text-sm text-teal-400 mb-4">
          Showing matches for <span className="font-semibold">{selectedPlayer.name}</span>
        </p>
      )}

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}

      {!loading && games.length === 0 && (
        <p className="text-slate-500 text-sm">No matches found.</p>
      )}

      {!loading && games.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Type</th>
                <th className="px-3 py-3 text-left">Team 1</th>
                <th className="px-3 py-3 text-center">Score</th>
                <th className="px-3 py-3 text-left">Team 2</th>
                <th className="px-3 py-3 text-center">Ratings</th>
                <th className="px-3 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {games.map((g) => {
                const t1won = g.team1Score > g.team2Score;
                return (
                  <tr key={g.id} className="bg-slate-800/50 hover:bg-slate-800">
                    <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(g.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-slate-300 text-xs">{GAME_TYPE_LABELS[g.gameType] ?? g.gameType}</span>
                      <span className="text-slate-500 text-xs ml-1">· {formatLabel(g)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 text-xs">
                      {teamNames(g.team1Player1, g.team1Player2)}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`font-bold text-xs ${t1won ? "text-teal-400" : "text-slate-400"}`}>
                        {g.team1Score}
                      </span>
                      <span className="text-slate-600 mx-1">–</span>
                      <span className={`font-bold text-xs ${!t1won ? "text-teal-400" : "text-slate-400"}`}>
                        {g.team2Score}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 text-xs">
                      {teamNames(g.team2Player1, g.team2Player2)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {g.ratingHistory.length > 0 ? (
                        <span className="text-xs text-teal-600">Applied</span>
                      ) : (
                        <span className="text-xs text-slate-600">None</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => { setDeleteTarget(g); setDeleteError(""); }}
                        className="px-2.5 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 text-xs rounded-md border border-red-800/50 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Delete Match?</h2>
            <p className="text-slate-400 text-sm mb-4">This cannot be undone.</p>

            {/* Match summary */}
            <div className="bg-slate-900 rounded-lg p-4 mb-4 text-sm space-y-1">
              <div className="text-slate-300 font-medium">
                {teamNames(deleteTarget.team1Player1, deleteTarget.team1Player2)}
                <span className="text-slate-500 mx-2">vs</span>
                {teamNames(deleteTarget.team2Player1, deleteTarget.team2Player2)}
              </div>
              <div className="text-slate-400">
                Score: <span className="text-slate-200">{deleteTarget.team1Score} – {deleteTarget.team2Score}</span>
                <span className="mx-2 text-slate-600">·</span>
                {new Date(deleteTarget.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                <span className="mx-2 text-slate-600">·</span>
                {GAME_TYPE_LABELS[deleteTarget.gameType] ?? deleteTarget.gameType} {formatLabel(deleteTarget)}
              </div>
              {deleteTarget.ratingHistory.length > 0 && (
                <p className="text-yellow-400 text-xs pt-1">
                  Rating changes for {deleteTarget.ratingHistory.length} player{deleteTarget.ratingHistory.length !== 1 ? "s" : ""} will be reversed.
                </p>
              )}
            </div>

            {deleteError && (
              <p className="text-red-400 text-sm mb-3">{deleteError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Match"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
