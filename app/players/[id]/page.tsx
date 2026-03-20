import { notFound } from "next/navigation";

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

const FORMAT_LABELS: Record<Format, string> = {
  MENS_SINGLES: "Men's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_SINGLES: "Women's Singles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

const PLAY_TYPE_LABELS: Record<PlayType, string> = {
  TOURNAMENT: "Tournament",
  LEAGUE: "League",
  RECREATIONAL: "Recreational",
};

interface Rating {
  playType: string;
  format: string;
  rating: number;
  reliability: number;
  gamesPlayed: number;
}

interface PlayerDetail {
  id: string;
  name: string;
  gender: string;
  age: number;
  createdAt: string;
  ratings: Rating[];
}

async function getPlayer(id: string): Promise<PlayerDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/players/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

function getRatingFor(ratings: Rating[], playType: string, format: string): Rating | null {
  return ratings.find((r) => r.playType === playType && r.format === format) ?? null;
}

function ReliabilityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);

  if (!player) notFound();

  const joinDate = new Date(player.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalGames = player.ratings.reduce((sum, r) => sum + r.gamesPlayed, 0);
  const bestRating =
    player.ratings.length > 0 ? Math.max(...player.ratings.map((r) => r.rating)) : null;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Player header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/60 border border-slate-700 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-teal-900 border-2 border-teal-600 flex items-center justify-center text-3xl font-bold text-teal-300 shrink-0">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-100">{player.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300">
                {player.gender === "MALE" ? "Male" : "Female"}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300">
                Age {player.age}
              </span>
              <span className="text-slate-400 text-sm">Member since {joinDate}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center sm:text-right">
            <div>
              <div className="text-3xl font-bold text-teal-400">
                {bestRating !== null ? bestRating.toFixed(2) : "—"}
              </div>
              <div className="text-xs text-slate-400">Best Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-200">{totalGames}</div>
              <div className="text-xs text-slate-400">Total Games</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings table */}
      <h2 className="text-xl font-bold text-slate-200 mb-4">Ratings by Play Type &amp; Format</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Format</th>
              {PLAY_TYPES.map((pt) => (
                <th
                  key={pt}
                  colSpan={2}
                  className="text-center px-4 py-3 text-slate-400 font-medium border-l border-slate-700"
                >
                  {PLAY_TYPE_LABELS[pt]}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left px-4 py-2 text-slate-500 text-xs font-normal"></th>
              {PLAY_TYPES.map((pt) => (
                <th
                  key={`${pt}-rating`}
                  colSpan={2}
                  className="text-center px-3 py-2 text-slate-500 text-xs font-normal border-l border-slate-700"
                >
                  Rating / Reliability
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FORMATS.map((format, idx) => (
              <tr
                key={format}
                className={`border-b border-slate-700/50 ${
                  idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30"
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-300 whitespace-nowrap">
                  {FORMAT_LABELS[format]}
                </td>
                {PLAY_TYPES.map((pt) => {
                  const r = getRatingFor(player.ratings, pt, format);
                  return [
                    <td
                      key={`${pt}-${format}-rating`}
                      className="px-3 py-3 text-center border-l border-slate-700/50"
                    >
                      {r ? (
                        <span className="text-teal-300 font-semibold">
                          {r.rating.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>,
                    <td
                      key={`${pt}-${format}-rel`}
                      className="px-3 py-3 min-w-[100px]"
                    >
                      {r ? (
                        <ReliabilityBar value={r.reliability} />
                      ) : (
                        <span className="text-slate-600 text-xs block text-center">—</span>
                      )}
                    </td>,
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Reliability increases as more games are played, reaching 100% after approximately 30 games.
        Higher reliability means the rating is more stable.
      </p>
    </div>
  );
}
