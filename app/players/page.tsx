export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { PlayersClient } from "./PlayersClient";

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

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Players</h1>
          <p className="text-slate-400 mt-1">
            {players.length} registered player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <PlayersClient players={players} />
    </div>
  );
}
