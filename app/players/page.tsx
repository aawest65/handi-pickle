export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { PlayersClient } from "./PlayersClient";

async function getPlayers() {
  return prisma.player.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, playerNumber: true, name: true, gender: true, dateOfBirth: true,
      city: true, state: true, selfRatedCategory: true, currentRating: true,
      gamesPlayed: true, showAge: true, avatarUrl: true,
      singlesRating: true, doublesRating: true, mixedRating: true,
      singlesGamesPlayed: true, doublesGamesPlayed: true, mixedGamesPlayed: true,
      sportsmanshipSum: true, sportsmanshipCount: true,
      categoryRatings: { select: { format: true, gameCategory: true, rating: true, gamesPlayed: true } },
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
        </div>
      </div>
      <PlayersClient players={players} />
    </div>
  );
}
