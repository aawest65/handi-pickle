import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClubDigestEmail, type ClubDigestPayload } from "@/lib/email";

// POST /api/cron/weekly-digest
// Called by Vercel Cron every Monday at 9am UTC.
// Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const clubs = await prisma.club.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      memberships: {
        select: {
          player: {
            select: {
              id: true,
              name: true,
              currentRating: true,
              gamesPlayed: true,
              emailDigestOptOut: true,
              user: {
                select: {
                  email: true,
                  emailConsentAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const club of clubs) {
    const members = club.memberships.map((m) => m.player);

    // eligible = has email, gave consent, hasn't opted out of digests
    const eligible = members.filter(
      (p) => p.user.email && p.user.emailConsentAt && !p.emailDigestOptOut
    );

    if (eligible.length === 0) continue;

    // Club games this week
    const weekGames = await prisma.game.findMany({
      where: { clubId: club.id, date: { gte: weekAgo }, status: "APPROVED" },
      select: { id: true },
    });
    const totalGamesThisWeek = weekGames.length;
    const weekGameIds = weekGames.map((g) => g.id);

    // Rating changes this week per player (net delta)
    const weekHistory = weekGameIds.length > 0
      ? await prisma.ratingHistory.findMany({
          where: { gameId: { in: weekGameIds }, clubId: club.id },
          select: { playerId: true, delta: true, ratingAfter: true },
        })
      : [];

    const deltaByPlayer = new Map<string, { netDelta: number; ratingAfter: number; name: string }>();
    for (const h of weekHistory) {
      const player = members.find((p) => p.id === h.playerId);
      if (!player) continue;
      const existing = deltaByPlayer.get(h.playerId);
      if (existing) {
        existing.netDelta += h.delta;
        existing.ratingAfter = h.ratingAfter;
      } else {
        deltaByPlayer.set(h.playerId, { netDelta: h.delta, ratingAfter: h.ratingAfter, name: player.name });
      }
    }

    const topMovers = Array.from(deltaByPlayer.values())
      .filter((m) => m.netDelta > 0)
      .sort((a, b) => b.netDelta - a.netDelta)
      .slice(0, 5)
      .map((m) => ({ name: m.name, delta: m.netDelta, ratingAfter: m.ratingAfter }));

    const leaderboard = [...members]
      .sort((a, b) => b.currentRating - a.currentRating)
      .slice(0, 10)
      .map((p) => ({ name: p.name, currentRating: p.currentRating, gamesPlayed: p.gamesPlayed }));

    for (const player of eligible) {
      const playerEntry = deltaByPlayer.get(player.id);
      const playerGameIds = weekGameIds.length > 0
        ? await prisma.ratingHistory.findMany({
            where: { gameId: { in: weekGameIds }, playerId: player.id },
            select: { gameId: true },
            distinct: ["gameId"],
          })
        : [];

      const payload: ClubDigestPayload = {
        clubName: club.name,
        totalGamesThisWeek,
        topMovers,
        leaderboard,
        playerStats: {
          gamesThisWeek: playerGameIds.length,
          ratingChange: playerEntry?.netDelta ?? 0,
          currentRating: player.currentRating,
        },
      };

      try {
        await sendClubDigestEmail(player.user.email!, player.name, payload);
        sent++;
      } catch (err) {
        errors.push(`${player.user.email}: ${String(err)}`);
        skipped++;
      }
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
