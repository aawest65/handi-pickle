"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const GAME_TYPE_LABELS: Record<string, string> = {
  REC:          "Recreational",
  CLUB:         "Club",
  TOURNEY_REG:  "Tournament — Regular",
  TOURNEY_MEDAL:"Tournament — Medal Round",
};

interface Tournament {
  id:   string;
  name: string;
  status: string;
}

interface Player {
  id:     string;
  name:   string;
  gender: string;
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function PlayerSearch({
  value,
  onChange,
  players,
  excluded,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  players: Player[];
  excluded: string[];
  placeholder?: string;
}) {
  const selected = players.find((p) => p.id === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.name]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selected?.name]);

  const available = players.filter(
    (p) => (!excluded.includes(p.id) || p.id === value) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(p: Player) {
    onChange(p.id);
    setQuery(p.name);
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder ?? "Search player..."}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={() => setOpen(true)}
          className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
      {open && available.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {available.map((p) => (
            <li
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer flex justify-between"
            >
              <span>{p.name}</span>
              <span className="text-slate-400 text-xs">{p.gender === "MALE" ? "M" : "F"}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.length > 0 && available.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-500">
          No players found
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role                 = (session?.user as { role?: string })?.role ?? "USER";
  const isTournamentDirector = (session?.user as { isTournamentDirector?: boolean })?.isTournamentDirector ?? false;
  const canEnterTournament   = role === "ADMIN" || role === "SUPER_ADMIN" || isTournamentDirector;

  const GAME_TYPES = canEnterTournament
    ? (["REC", "CLUB", "TOURNEY_REG", "TOURNEY_MEDAL"] as const)
    : (["REC", "CLUB"] as const);

  const [players, setPlayers]             = useState<Player[]>([]);
  const [tournaments, setTournaments]     = useState<Tournament[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const [gameType, setGameType]           = useState("REC");
  const [format, setFormat]               = useState<"SINGLES" | "DOUBLES">("SINGLES");
  const [date, setDate]                   = useState(new Date().toISOString().split("T")[0]);
  const [maxScore, setMaxScore]           = useState(11);
  const [team1Player1Id, setT1P1]         = useState("");
  const [team1Player2Id, setT1P2]         = useState("");
  const [team2Player1Id, setT2P1]         = useState("");
  const [team2Player2Id, setT2P2]         = useState("");
  const [team1Score, setTeam1Score]       = useState<number | "">(0);
  const [team2Score, setTeam2Score]       = useState<number | "">(0);
  const [tournamentId, setTournamentId]   = useState("");

  const isDoubles      = format === "DOUBLES";
  const isTourneyType  = gameType === "TOURNEY_REG" || gameType === "TOURNEY_MEDAL";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/matches");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!canEnterTournament) return;
    fetch("/api/admin/tournaments")
      .then(r => r.json())
      .then((data: Tournament[]) => setTournaments(data.filter(t => t.status !== "CANCELLED" && t.status !== "COMPLETED")))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEnterTournament]);

  useEffect(() => {
    if (!isDoubles) {
      setT1P2("");
      setT2P2("");
    }
  }, [isDoubles]);

  useEffect(() => {
    if (!isTourneyType) setTournamentId("");
  }, [isTourneyType]);

  const allSelectedIds = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id].filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!team1Player1Id || !team2Player1Id) {
      setError("Please select at least one player per team.");
      return;
    }
    if (isDoubles && (!team1Player2Id || !team2Player2Id)) {
      setError("Doubles requires two players per team.");
      return;
    }
    if (team1Score === "" || team2Score === "") {
      setError("Please enter scores for both teams.");
      return;
    }
    if (team1Score === team2Score) {
      setError("Games cannot end in a tie.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        gameType, format, date, maxScore,
        team1Player1Id, team2Player1Id,
        team1Score, team2Score,
      };
      if (isDoubles) {
        body.team1Player2Id = team1Player2Id;
        body.team2Player2Id = team2Player2Id;
      }
      if (tournamentId) {
        body.tournamentId = tournamentId;
      }

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to record game");
      }

      const game = await res.json();
      router.push(`/rate/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record game");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  const t1Name = players.find((p) => p.id === team1Player1Id)?.name;
  const t2Name = players.find((p) => p.id === team2Player1Id)?.name;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Record a Game</h1>
        <p className="text-slate-400 mt-1">Submit results to update player ratings automatically.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game details */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-200">Game Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <InputLabel>Game Type</InputLabel>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {GAME_TYPES.map((gt) => (
                  <option key={gt} value={gt}>{GAME_TYPE_LABELS[gt]}</option>
                ))}
              </select>
            </div>
            <div>
              <InputLabel>Format</InputLabel>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "SINGLES" | "DOUBLES")}
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="SINGLES">Singles</option>
                <option value="DOUBLES">Doubles</option>
              </select>
            </div>
          </div>

          {/* Tournament selector — only visible to TDs/admins when a tournament type is selected */}
          {canEnterTournament && isTourneyType && (
            <div>
              <InputLabel>Tournament (optional)</InputLabel>
              <select
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                className="w-full bg-slate-900 border border-teal-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">— No tournament —</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {tournaments.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">No active tournaments found.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <InputLabel>Date</InputLabel>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <InputLabel>Max Score (game to)</InputLabel>
              <input
                type="number"
                min={7}
                max={21}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Team 1 */}
          <div className="bg-slate-800 border border-teal-800/50 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-teal-400">Team 1</h2>
            <div>
              <InputLabel>Player 1 *</InputLabel>
              <PlayerSearch
                value={team1Player1Id}
                onChange={setT1P1}
                players={players}
                excluded={allSelectedIds.filter((id) => id !== team1Player1Id)}
              />
            </div>
            {isDoubles && (
              <div>
                <InputLabel>Player 2 *</InputLabel>
                <PlayerSearch
                  value={team1Player2Id}
                  onChange={setT1P2}
                  players={players}
                  excluded={allSelectedIds.filter((id) => id !== team1Player2Id)}
                />
              </div>
            )}
            <div>
              <InputLabel>Score *</InputLabel>
              <input
                type="number"
                min={0}
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-slate-800 border border-slate-600/50 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-300">Team 2</h2>
            <div>
              <InputLabel>Player 1 *</InputLabel>
              <PlayerSearch
                value={team2Player1Id}
                onChange={setT2P1}
                players={players}
                excluded={allSelectedIds.filter((id) => id !== team2Player1Id)}
              />
            </div>
            {isDoubles && (
              <div>
                <InputLabel>Player 2 *</InputLabel>
                <PlayerSearch
                  value={team2Player2Id}
                  onChange={setT2P2}
                  players={players}
                  excluded={allSelectedIds.filter((id) => id !== team2Player2Id)}
                />
              </div>
            )}
            <div>
              <InputLabel>Score *</InputLabel>
              <input
                type="number"
                min={0}
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Score preview */}
        {team1Score !== "" && team2Score !== "" && team1Score !== team2Score && (
          <div className="text-center py-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-sm">
              Winner:{" "}
              <span className="font-semibold text-teal-400">
                {(team1Score as number) > (team2Score as number)
                  ? (t1Name ?? "Team 1")
                  : (t2Name ?? "Team 2")}
              </span>{" "}
              ({team1Score} &ndash; {team2Score})
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 disabled:text-teal-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {loading ? "Recording game..." : "Record Game & Update Ratings"}
        </button>
      </form>
    </div>
  );
}
