import Link from "next/link";

interface Rating {
  playType: string;
  format: string;
  rating: number;
  reliability: number;
  gamesPlayed: number;
}

interface Player {
  id: string;
  name: string;
  gender: string;
  createdAt: string;
  ratings: Rating[];
}

async function getPlayers(): Promise<Player[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/players`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

function getBestRating(ratings: Rating[]): number | null {
  if (!ratings.length) return null;
  return Math.max(...ratings.map((r) => r.rating));
}

function getTotalGames(ratings: Rating[]): number {
  return ratings.reduce((sum, r) => sum + r.gamesPlayed, 0);
}

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Players</h1>
          <p className="text-slate-400 mt-1">
            {players.length} registered player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-lg font-medium text-slate-300">No players yet</p>
          <p className="text-sm mt-2">Players are created when users register and set up a profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {players.map((player) => {
            const bestRating = getBestRating(player.ratings);
            const totalGames = getTotalGames(player.ratings);
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-teal-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-teal-900/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                      {player.name}
                    </h2>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                      {player.gender === "MALE" ? "Male" : "Female"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-teal-400">
                      {bestRating !== null ? bestRating.toFixed(2) : "—"}
                    </div>
                    <div className="text-xs text-slate-500">best rating</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-slate-700">
                  <span>{totalGames} game{totalGames !== 1 ? "s" : ""} played</span>
                  <span>{player.ratings.length} rating{player.ratings.length !== 1 ? "s" : ""}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
