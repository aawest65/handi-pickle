"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PLAY_TYPES = ["RECREATIONAL", "LEAGUE", "TOURNAMENT"] as const;
const FORMATS = [
  "MENS_SINGLES",
  "MENS_DOUBLES",
  "WOMENS_SINGLES",
  "WOMENS_DOUBLES",
  "MIXED_DOUBLES",
] as const;

type Format = (typeof FORMATS)[number];

const PLAY_TYPE_LABELS: Record<string, string> = {
  RECREATIONAL: "Recreational",
  LEAGUE: "League",
  TOURNAMENT: "Tournament",
};

const FORMAT_LABELS: Record<string, string> = {
  MENS_SINGLES: "Men's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_SINGLES: "Women's Singles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

const SINGLES_FORMATS: Format[] = ["MENS_SINGLES", "WOMENS_SINGLES"];

interface Player {
  id: string;
  name: string;
  gender: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
  season: string;
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
}: {
  value: number | string;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playType, setPlayType] = useState("RECREATIONAL");
  const [isMedalRound, setIsMedalRound] = useState(false);
  const [format, setFormat] = useState("MENS_SINGLES");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [team1Player1Id, setTeam1Player1Id] = useState("");
  const [team1Player2Id, setTeam1Player2Id] = useState("");
  const [team2Player1Id, setTeam2Player1Id] = useState("");
  const [team2Player2Id, setTeam2Player2Id] = useState("");
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [tournamentId, setTournamentId] = useState("");
  const [leagueId, setLeagueId] = useState("");

  const isDoubles = !SINGLES_FORMATS.includes(format as Format);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(console.error);
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then(setTournaments)
      .catch(console.error);
    fetch("/api/leagues")
      .then((r) => r.json())
      .then(setLeagues)
      .catch(console.error);
  }, []);

  // Reset doubles players when switching to singles
  useEffect(() => {
    if (!isDoubles) {
      setTeam1Player2Id("");
      setTeam2Player2Id("");
    }
  }, [isDoubles]);

  // Reset tournament/league/medalRound when play type changes
  useEffect(() => {
    if (playType !== "TOURNAMENT") {
      setTournamentId("");
      setIsMedalRound(false);
    }
    if (playType !== "LEAGUE") setLeagueId("");
  }, [playType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!team1Player1Id || !team2Player1Id) {
      setError("Please select players for both teams.");
      return;
    }

    if (isDoubles && (!team1Player2Id || !team2Player2Id)) {
      setError("Please select both players for each team in doubles format.");
      return;
    }

    if (team1Score === team2Score) {
      setError("Matches cannot end in a tie. Please enter valid scores.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        playType,
        format,
        date,
        team1Player1Id,
        team2Player1Id,
        team1Score,
        team2Score,
      };

      if (isDoubles) {
        if (team1Player2Id) body.team1Player2Id = team1Player2Id;
        if (team2Player2Id) body.team2Player2Id = team2Player2Id;
      }

      if (playType === "TOURNAMENT" && tournamentId) body.tournamentId = tournamentId;
      if (playType === "TOURNAMENT") body.isMedalRound = isMedalRound;
      if (playType === "LEAGUE" && leagueId) body.leagueId = leagueId;

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to record match");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/leaderboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record match");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-teal-400 mb-2">Match Recorded!</h2>
        <p className="text-slate-400">Ratings have been updated. Redirecting to leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Record a Match</h1>
        <p className="text-slate-400 mt-1">
          Submit match results to update player ratings automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match details */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-200">Match Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <InputLabel>Play Type</InputLabel>
              <Select value={playType} onChange={setPlayType}>
                {PLAY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {PLAY_TYPE_LABELS[pt]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <InputLabel>Format</InputLabel>
              <Select value={format} onChange={setFormat}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

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

          {/* Tournament link */}
          {playType === "TOURNAMENT" && (
            <div>
              <InputLabel>Tournament (optional)</InputLabel>
              <Select value={tournamentId} onChange={setTournamentId}>
                <option value="">-- Select tournament --</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Medal Round checkbox — only shown for TOURNAMENT */}
          {playType === "TOURNAMENT" && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isMedalRound}
                  onChange={(e) => setIsMedalRound(e.target.checked)}
                  className="accent-teal-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-300 group-hover:text-teal-400 transition-colors">
                  Medal Round
                </span>
              </label>
            </div>
          )}

          {/* League link */}
          {playType === "LEAGUE" && (
            <div>
              <InputLabel>League (optional)</InputLabel>
              <Select value={leagueId} onChange={setLeagueId}>
                <option value="">-- Select league --</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.season})
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Team 1 */}
          <div className="bg-slate-800 border border-teal-800/50 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-teal-400">Team 1</h2>
            <div>
              <InputLabel>Player 1 *</InputLabel>
              <Select value={team1Player1Id} onChange={setTeam1Player1Id}>
                <option value="">-- Select player --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            {isDoubles && (
              <div>
                <InputLabel>Player 2 *</InputLabel>
                <Select value={team1Player2Id} onChange={setTeam1Player2Id}>
                  <option value="">-- Select player --</option>
                  {players
                    .filter((p) => p.id !== team1Player1Id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}
            <div>
              <InputLabel>Score *</InputLabel>
              <NumberInput value={team1Score} onChange={setTeam1Score} />
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-slate-800 border border-slate-600/50 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-300">Team 2</h2>
            <div>
              <InputLabel>Player 1 *</InputLabel>
              <Select value={team2Player1Id} onChange={setTeam2Player1Id}>
                <option value="">-- Select player --</option>
                {players
                  .filter(
                    (p) => p.id !== team1Player1Id && p.id !== team1Player2Id
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
            </div>
            {isDoubles && (
              <div>
                <InputLabel>Player 2 *</InputLabel>
                <Select value={team2Player2Id} onChange={setTeam2Player2Id}>
                  <option value="">-- Select player --</option>
                  {players
                    .filter(
                      (p) =>
                        p.id !== team1Player1Id &&
                        p.id !== team1Player2Id &&
                        p.id !== team2Player1Id
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}
            <div>
              <InputLabel>Score *</InputLabel>
              <NumberInput value={team2Score} onChange={setTeam2Score} />
            </div>
          </div>
        </div>

        {/* Score preview */}
        {(team1Score > 0 || team2Score > 0) && team1Score !== team2Score && (
          <div className="text-center py-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-sm">
              Winner:{" "}
              <span className="font-semibold text-teal-400">
                {team1Score > team2Score
                  ? players.find((p) => p.id === team1Player1Id)?.name ?? "Team 1"
                  : players.find((p) => p.id === team2Player1Id)?.name ?? "Team 2"}
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
          {loading ? "Recording match..." : "Record Match & Update Ratings"}
        </button>
      </form>
    </div>
  );
}
