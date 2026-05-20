import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processGame } from "@/lib/rating/algorithm";

// PATCH — approve or dispute a pending game
// action: "approve" | "dispute" | "force-approve" (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json() as { action: "approve" | "dispute" | "force-approve" };

  const role = (session.user as { role?: string }).role ?? "USER";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (action === "force-approve" && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      submittedByUserId: true,
      team1Player1Id: true,
      team1Player2Id: true,
      team2Player1Id: true,
      team2Player2Id: true,
    },
  });

  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  if (!["PENDING", "FLAGGED", "DISPUTED"].includes(game.status) && !isAdmin) {
    return NextResponse.json({ error: "Game is already resolved" }, { status: 409 });
  }

  // For player approve/dispute: verify they're on the opposing team from the submitter
  if (!isAdmin) {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const playerIds = [game.team1Player1Id, game.team1Player2Id, game.team2Player1Id, game.team2Player2Id].filter(Boolean);
    if (!playerIds.includes(player.id)) {
      return NextResponse.json({ error: "You did not play in this game" }, { status: 403 });
    }
    if (game.submittedByUserId === session.user.id) {
      return NextResponse.json({ error: "You cannot approve your own submission" }, { status: 403 });
    }

    // Determine which team the submitter's player is on and enforce opposing-team approval
    if (game.submittedByUserId) {
      const submitterPlayer = await prisma.player.findUnique({
        where: { userId: game.submittedByUserId },
        select: { id: true },
      });
      if (submitterPlayer) {
        const submitterOnTeam1 = game.team1Player1Id === submitterPlayer.id || game.team1Player2Id === submitterPlayer.id;
        const submitterOnTeam2 = game.team2Player1Id === submitterPlayer.id || game.team2Player2Id === submitterPlayer.id;
        const approverOnTeam1  = game.team1Player1Id === player.id || game.team1Player2Id === player.id;
        const approverOnTeam2  = game.team2Player1Id === player.id || game.team2Player2Id === player.id;

        if (submitterOnTeam1 && !approverOnTeam2) {
          return NextResponse.json({ error: "Only the opposing team can approve this score" }, { status: 403 });
        }
        if (submitterOnTeam2 && !approverOnTeam1) {
          return NextResponse.json({ error: "Only the opposing team can approve this score" }, { status: 403 });
        }
      }
    }
  }

  if (action === "dispute") {
    await prisma.game.update({ where: { id }, data: { status: "DISPUTED" } });
    return NextResponse.json({ success: true, status: "DISPUTED" });
  }

  // approve or force-approve: run ratings
  await prisma.$transaction(async (tx) => {
    await tx.game.update({ where: { id }, data: { status: "APPROVED" } });

    // Apply any deferred sportsmanship ratings stored while game was pending
    const ratings = await tx.sportsmanshipRating.findMany({ where: { gameId: id } });
    for (const r of ratings) {
      await tx.player.update({
        where: { id: r.ratedPlayerId },
        data: { sportsmanshipSum: { increment: r.score }, sportsmanshipCount: { increment: 1 } },
      });
    }
  });

  await processGame(id);

  return NextResponse.json({ success: true, status: "APPROVED" });
}
