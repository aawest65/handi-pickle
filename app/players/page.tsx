export const dynamic = 'force-dynamic';

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pickleballAge } from "@/lib/pickleballAge";

async function getPlayers() {
  return prisma.player.findMany({
    orderBy: { currentRating: "desc" },
    select: {
      id: true, playerNumber: true, name: true, gender: true, dateOfBirth: true,
      city: true, state: true, selfRatedCategory: true, currentRating: true,
      gamesPlayed: true, showAge: true,
    },
  });
}

const CATEGORY_COLOR: Record<string, string> = {
  PRO:          "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  ADVANCED:     "bg-blue-500/20 text-blue-300 border-blue-500/40",
  INTERMEDIATE: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  NOVICE:       "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

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
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-teal-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-teal-900/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                      {player.name}
                    </h2>
                    {(player.city || player.state) && (
                      <span className="text-xs text-slate-400">
                        {[player.city, player.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
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
              <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-slate-700">
                <span>{player.gamesPlayed} game{player.gamesPlayed !== 1 ? "s" : ""} played</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
