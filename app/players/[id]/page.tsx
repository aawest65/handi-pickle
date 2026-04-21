export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { pickleballAge } from "@/lib/pickleballAge";
import { calcReliability, RELIABILITY_GAMES_TARGET } from "@/lib/reliability";

// ─── helpers ────────────────────────────────────────────────────────────────

function sportsmanshipGrade(sum: number, count: number): string {
  if (count === 0) return "—";
  const avg = sum / count;
  if (avg >= 4.5) return "A";
  if (avg >= 3.5) return "B";
  if (avg >= 2.5) return "C";
  if (avg >= 1.5) return "D";
  return "F";
}

function reliabilityColor(pct: number): string {
  if (pct >= 85) return "text-teal-400";
  if (pct >= 70) return "text-yellow-400";
  return "text-red-400";
}

const GAME_TYPE_LABELS: Record<string, string> = {
  REC:           "Recreational",
  CLUB:          "Club",
  TOURNEY_REG:   "Tournament Regular",
  TOURNEY_MEDAL: "Tournament Medal",
};

// ─── data ────────────────────────────────────────────────────────────────────

async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      memberships: { where: { isPrimary: true }, select: { club: { select: { id: true, name: true } } } },
      categoryRatings: true,
      ratingHistory: {
        include: {
          game: {
            include: {
              team1Player1: { select: { id: true, name: true, playerNumber: true } },
              team1Player2: { select: { id: true, name: true, playerNumber: true } },
              team2Player1: { select: { id: true, name: true, playerNumber: true } },
              team2Player2: { select: { id: true, name: true, playerNumber: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatBox({ label, mobileLabel, children }: { label: string; mobileLabel?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-2 md:px-4 min-w-0">
      <div className="text-[9px] md:text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1 text-center leading-tight">
        <span className="md:hidden">{mobileLabel ?? label}</span>
        <span className="hidden md:inline">{label}</span>
      </div>
      {children}
    </div>
  );
}

function CategoryCell({
  row,
}: {
  row: { rating: number; gamesPlayed: number; wins: number } | undefined;
}) {
  if (!row || row.gamesPlayed === 0) {
    return (
      <td className="text-center py-4 text-slate-500 text-lg font-medium">—</td>
    );
  }
  const reliabilityPct = Math.round(calcReliability(row.gamesPlayed) * 100);
  return (
    <td className="text-center py-4">
      <div className="text-xl font-bold text-slate-100">{row.rating.toFixed(2)}</div>
      <div className="text-xs text-slate-400 mt-0.5">{row.gamesPlayed} game{row.gamesPlayed !== 1 ? "s" : ""}</div>
      <div className={`text-sm font-semibold mt-0.5 ${reliabilityColor(reliabilityPct)}`}>{reliabilityPct}%</div>
    </td>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const sign  = delta >= 0 ? "+" : "";
  const color = delta >= 0 ? "text-teal-400" : "text-red-400";
  return <span className={`font-medium text-sm ${color}`}>{sign}{delta.toFixed(4)}</span>;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = await params;
  const player  = await getPlayer(id);
  if (!player) notFound();

  const age            = pickleballAge(player.dateOfBirth);
  const memberYear     = new Date(player.createdAt).getFullYear();
  const sportGrade     = sportsmanshipGrade(player.sportsmanshipSum, player.sportsmanshipCount);
  const doublesLabel   = player.gender === "MALE" ? "Men's Doubles" : "Women's Doubles";

  // W / L derived from category rating totals (accurate even for historical data)
  const totalWins   = player.categoryRatings.reduce((s, r) => s + r.wins, 0);
  const totalGames  = player.categoryRatings.reduce((s, r) => s + r.gamesPlayed, 0);
  const totalLosses = totalGames - totalWins;

  // Helper: find a category rating row
  const catRow = (fmt: string, cat: string) =>
    player.categoryRatings.find(r => r.format === fmt && r.gameCategory === cat);

  const CATEGORIES = [
    { key: "TOURNEY", label: "Tournament" },
    { key: "CLUB",    label: "Club"       },
    { key: "REC",     label: "Recreation" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-10 px-3 md:px-4 space-y-6">

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

        {/* Header bar */}
        <div className="bg-[#1b3a2b] px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
            Handi-Pickle · Player Profile
          </span>
          <span className="text-xs text-slate-400 italic">ID: {player.playerNumber}</span>
        </div>

        {/* Main profile section */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-emerald-900 border-2 border-emerald-600 overflow-hidden flex items-center justify-center text-3xl font-bold text-emerald-300 shrink-0 relative self-start">
              {player.avatarUrl ? (
                <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" sizes="80px" />
              ) : (
                player.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
              )}
            </div>

            {/* Name + stats */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-100 leading-tight">{player.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Member since {memberYear}
                {player.memberships[0]?.club && <span className="ml-2 text-emerald-400">· {player.memberships[0].club.name}</span>}
                {(player.city || player.state) && (
                  <span className="ml-2">· {[player.city, player.state].filter(Boolean).join(", ")}</span>
                )}
              </p>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-3 md:flex md:flex-nowrap divide-y divide-x-0 md:divide-y-0 md:divide-x divide-slate-700 border border-slate-700 rounded-xl overflow-hidden w-full md:w-fit">

                <StatBox label="Level">
                  <span className="text-xl font-bold text-slate-100">{player.currentRating.toFixed(1)}</span>
                </StatBox>

                <StatBox label="Gender">
                  <span className="text-base font-semibold text-slate-200">
                    {player.gender === "MALE" ? "Male" : "Female"}
                  </span>
                </StatBox>

                {player.showAge && (
                  <StatBox label="Age">
                    <span className="text-xl font-bold text-slate-100">{age}</span>
                  </StatBox>
                )}

                <StatBox label="Overall">
                  <span className="text-xl font-bold text-amber-400">{player.currentRating.toFixed(2)}</span>
                </StatBox>

                <StatBox label="Sportsmanship" mobileLabel="Sport.">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold border-2 ${
                    sportGrade === "—"
                      ? "border-slate-600 text-slate-500"
                      : sportGrade === "A" ? "border-emerald-500 bg-emerald-900/50 text-emerald-300"
                      : sportGrade === "B" ? "border-teal-500 bg-teal-900/50 text-teal-300"
                      : sportGrade === "C" ? "border-yellow-500 bg-yellow-900/50 text-yellow-300"
                      : "border-red-500 bg-red-900/50 text-red-300"
                  }`}>
                    {sportGrade}
                  </div>
                </StatBox>

                <StatBox label="W / L">
                  {totalGames === 0 ? (
                    <span className="text-lg font-bold text-slate-500">—</span>
                  ) : (
                    <>
                      <span className="text-base font-bold text-sky-400 tabular-nums leading-tight">
                        {totalWins} / {totalLosses}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {Math.round((totalWins / totalGames) * 100)}% win
                      </span>
                    </>
                  )}
                </StatBox>

              </div>
            </div>
          </div>
        </div>

        {/* ── Category rating grid ─────────────────────────────────────────── */}
        <div className="px-4 md:px-6 pb-6">

          {/* Mobile: stacked cards (one per category) */}
          <div className="md:hidden space-y-3">
            {CATEGORIES.map(({ key, label }) => {
              const doublesRow = catRow("DOUBLES", key);
              const mixedRow   = catRow("MIXED",   key);
              const singlesRow = catRow("SINGLES", key);
              return (
                <div key={key} className="rounded-xl border border-slate-700 overflow-hidden">
                  <div className="bg-[#1b3a2b] px-3 py-2 text-emerald-300 text-xs font-semibold uppercase tracking-wide">
                    {label}
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-slate-700 bg-slate-800">
                    {[
                      { row: doublesRow, title: doublesLabel },
                      { row: mixedRow,   title: "Mixed Dbl" },
                      { row: singlesRow, title: "Singles"   },
                    ].map(({ row, title }) => (
                      <div key={title} className="flex flex-col items-center py-3 px-1">
                        <div className="text-[9px] font-semibold tracking-wide text-emerald-300 uppercase mb-1 text-center leading-tight">
                          {title}
                        </div>
                        {row && row.gamesPlayed > 0 ? (
                          <>
                            <div className="text-base font-bold text-slate-100">{row.rating.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{row.gamesPlayed}g</div>
                            <div className={`text-[10px] font-semibold mt-0.5 ${reliabilityColor(Math.round(calcReliability(row.gamesPlayed) * 100))}`}>
                              {Math.round(calcReliability(row.gamesPlayed) * 100)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-500 text-lg font-medium">—</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1b3a2b] text-emerald-300">
                  <th className="text-left px-4 py-3 font-semibold tracking-wide text-xs uppercase w-32">
                    Play Category
                  </th>
                  <th className="text-center px-4 py-3 font-semibold tracking-wide text-xs uppercase">
                    {doublesLabel}
                  </th>
                  <th className="text-center px-4 py-3 font-semibold tracking-wide text-xs uppercase">
                    Mixed Doubles
                  </th>
                  <th className="text-center px-4 py-3 font-semibold tracking-wide text-xs uppercase">
                    Singles
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(({ key, label }, i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}>
                    <td className="px-4 py-4 font-semibold text-slate-300 border-r border-slate-700">
                      {label}
                    </td>
                    <CategoryCell row={catRow("DOUBLES", key)} />
                    <CategoryCell row={catRow("MIXED",   key)} />
                    <CategoryCell row={catRow("SINGLES", key)} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reliability legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Reliability (50 games = 100%):</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />≥85% High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />70–84% Med</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&lt;70% Low</span>
          </div>
        </div>
      </div>

      {/* ── Recent game history ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Recent Game History</h2>
        {player.ratingHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700">
            <p>No games recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {player.ratingHistory.map((h) => {
              const g = h.game;
              const onTeam1  = g.team1Player1Id === player.id || g.team1Player2Id === player.id;
              const myScore  = onTeam1 ? g.team1Score : g.team2Score;
              const oppScore = onTeam1 ? g.team2Score : g.team1Score;
              const won      = myScore > oppScore;

              const myTeammates = onTeam1
                ? [g.team1Player1, g.team1Player2].filter(p => p && p.id !== player.id)
                : [g.team2Player1, g.team2Player2].filter(p => p && p.id !== player.id);
              const opponents = onTeam1
                ? [g.team2Player1, g.team2Player2].filter(Boolean)
                : [g.team1Player1, g.team1Player2].filter(Boolean);

              return (
                <div key={h.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-sm font-medium text-slate-200">
                        {GAME_TYPE_LABELS[g.gameType] ?? g.gameType}
                      </span>
                      <span className="text-slate-500 text-sm mx-2">·</span>
                      <span className="text-slate-400 text-sm">
                        {g.format === "SINGLES" ? "Singles" : g.isMixed ? "Mixed Doubles" : doublesLabel}
                      </span>
                      <span className="text-slate-500 text-sm mx-2">·</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <DeltaBadge delta={h.delta} />
                      <div className="text-xs text-slate-500 mt-0.5">
                        {h.ratingBefore.toFixed(3)} → {h.ratingAfter.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold shrink-0 ${
                      won
                        ? "bg-teal-900/50 border border-teal-700 text-teal-300"
                        : "bg-red-900/30 border border-red-800/60 text-red-400"
                    }`}>
                      <span>{myScore}</span>
                      <span className="text-slate-500 font-normal">–</span>
                      <span>{oppScore}</span>
                      <span className={`text-xs ml-1 font-semibold ${won ? "text-teal-400" : "text-red-400"}`}>
                        {won ? "W" : "L"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs min-w-0">
                      {myTeammates.length > 0 && (
                        <div className="text-slate-400">
                          <span className="text-slate-500">w/ </span>
                          {myTeammates.map(p => (
                            <a key={p!.id} href={`/players/${p!.id}`} className="text-teal-400 hover:text-teal-300 hover:underline">
                              {p!.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-slate-400">
                        <span className="text-slate-500">vs </span>
                        {opponents.map((p, i) => (
                          <span key={p!.id}>
                            {i > 0 && <span className="text-slate-600"> & </span>}
                            <a href={`/players/${p!.id}`} className="text-slate-300 hover:text-slate-100 hover:underline">
                              {p!.name}
                            </a>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
