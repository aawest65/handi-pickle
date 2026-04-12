export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pickleballAge } from "@/lib/pickleballAge";

const GAME_TYPE_LABELS: Record<string, string> = {
  REC:          "Recreational",
  CLUB:         "Club",
  TOURNEY_REG:  "Tournament Regular",
  TOURNEY_MEDAL:"Tournament Medal",
};

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  NOVICE:       { label: "Novice",       color: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  INTERMEDIATE: { label: "Intermediate", color: "bg-teal-500/20 text-teal-300 border-teal-500/40" },
  ADVANCED:     { label: "Advanced",     color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  PRO:          { label: "Pro",          color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
};

async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      ratingHistory: {
        include: { game: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

function DeltaBadge({ delta }: { delta: number }) {
  const sign  = delta >= 0 ? "+" : "";
  const color = delta >= 0 ? "text-teal-400" : "text-red-400";
  return <span className={`font-medium text-sm ${color}`}>{sign}{delta.toFixed(4)}</span>;
}

function FactorRow({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? "text-teal-300" : value < 0 ? "text-red-300" : "text-slate-500";
  const sign  = value >= 0 ? "+" : "";
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={color}>{sign}{value.toFixed(4)}</span>
    </div>
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = await params;
  const player  = await getPlayer(id);
  if (!player) notFound();

  const joinDate     = new Date(player.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const skillCategory = CATEGORY_DISPLAY[player.selfRatedCategory];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/60 border border-slate-700 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-teal-900 border-2 border-teal-600 flex items-center justify-center text-3xl font-bold text-teal-300 shrink-0">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold text-slate-100">{player.name}</h1>
              <span className="text-sm text-slate-500">#{player.playerNumber}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300">
                {player.gender === "MALE" ? "Male" : "Female"}
              </span>
              {player.showAge && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300">
                  Age {pickleballAge(player.dateOfBirth)}
                </span>
              )}
              {(player.city || player.state) && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700 text-slate-300">
                  📍 {[player.city, player.state].filter(Boolean).join(", ")}
                </span>
              )}
              {skillCategory && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${skillCategory.color}`}>
                  {skillCategory.label}
                </span>
              )}
              <span className="text-slate-400 text-sm">Member since {joinDate}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center sm:text-right">
            <div>
              <div className="text-3xl font-bold text-teal-400">{player.currentRating.toFixed(3)}</div>
              <div className="text-xs text-slate-400">Current Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-200">{player.gamesPlayed}</div>
              <div className="text-xs text-slate-400">Games Played</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating history */}
      <h2 className="text-xl font-bold text-slate-200 mb-4">Recent Game History</h2>
      {player.ratingHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700">
          <p>No games recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {player.ratingHistory.map((h) => (
            <div key={h.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    {GAME_TYPE_LABELS[h.game.gameType] ?? h.game.gameType}
                  </span>
                  <span className="text-slate-500 text-sm ml-2">·</span>
                  <span className="text-slate-400 text-sm ml-2">
                    {h.game.format === "SINGLES" ? "Singles" : "Doubles"}
                  </span>
                  <span className="text-slate-500 text-sm ml-2">·</span>
                  <span className="text-slate-500 text-xs ml-2">
                    {new Date(h.game.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="text-right">
                  <DeltaBadge delta={h.delta} />
                  <div className="text-xs text-slate-500 mt-0.5">
                    {h.ratingBefore.toFixed(3)} → {h.ratingAfter.toFixed(3)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-slate-900/50 rounded-lg p-3">
                <FactorRow label="Win/Loss"  value={h.winLossFactor} />
                <FactorRow label="Type"      value={h.typeFactor} />
                <FactorRow label="Gender"    value={h.genderFactor} />
                <FactorRow label="Age"       value={h.ageFactor} />
                <FactorRow label="Rate×Type" value={h.rateTypeFactor} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
