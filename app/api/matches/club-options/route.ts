import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/matches/club-options?players=id1,id2,id3,id4
// Returns clubs that ALL specified players share membership in.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("players") ?? "";
  const playerIds = raw.split(",").map(s => s.trim()).filter(Boolean);

  if (playerIds.length < 2) {
    return NextResponse.json([]);
  }

  // Fetch club memberships for all players
  const memberships = await prisma.playerClub.findMany({
    where: { playerId: { in: playerIds } },
    select: { playerId: true, clubId: true },
  });

  // Find clubs present for every player
  const clubCounts = new Map<string, Set<string>>();
  for (const m of memberships) {
    if (!clubCounts.has(m.clubId)) clubCounts.set(m.clubId, new Set());
    clubCounts.get(m.clubId)!.add(m.playerId);
  }

  const sharedClubIds = [...clubCounts.entries()]
    .filter(([, players]) => playerIds.every(id => players.has(id)))
    .map(([clubId]) => clubId);

  if (sharedClubIds.length === 0) {
    return NextResponse.json([]);
  }

  const clubs = await prisma.club.findMany({
    where: { id: { in: sharedClubIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clubs);
}
