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
      approvals: { select: { playerId: true } },
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

  // force-approve (admin): skip approval tracking and process immediately
  if (action === "force-approve") {
    await prisma.$transaction(async (tx) => {
      await tx.game.update({ where: { id }, data: { status: "APPROVED" } });
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

  // Regular approve: record this player's approval, process only when all opponents have approved

  // Determine which players on the opposing team need to approve
  const submitterPlayer = game.submittedByUserId
    ? await prisma.player.findUnique({ where: { userId: game.submittedByUserId }, select: { id: true } })
    : null;

  const team1Ids = [game.team1Player1Id, game.team1Player2Id].filter(Boolean) as string[];
  const team2Ids = [game.team2Player1Id, game.team2Player2Id].filter(Boolean) as string[];

  const submitterOnTeam1 = submitterPlayer && team1Ids.includes(submitterPlayer.id);
  const requiredApproverIds = submitterOnTeam1 ? team2Ids : team1Ids;

  // Record this player's approval (upsert — idempotent if they somehow hit it twice)
  const approvingPlayerId = isAdmin
    ? null
    : (await prisma.player.findUnique({ where: { userId: session.user.id }, select: { id: true } }))?.id;

  if (approvingPlayerId) {
    await prisma.gameApproval.upsert({
      where: { gameId_playerId: { gameId: id, playerId: approvingPlayerId } },
      create: { gameId: id, playerId: approvingPlayerId },
      update: {},
    });
  }

  // Check how many required approvers have now approved
  const approvedPlayerIds = new Set([
    ...game.approvals.map((a) => a.playerId),
    ...(approvingPlayerId ? [approvingPlayerId] : []),
  ]);
  const allApproved = requiredApproverIds.every((pid) => approvedPlayerIds.has(pid));

  if (!allApproved) {
    const remaining = requiredApproverIds.filter((pid) => !approvedPlayerIds.has(pid)).length;
    return NextResponse.json({ success: true, status: "PENDING", waitingFor: remaining });
  }

  // All required approvals received — process the game
  await prisma.$transaction(async (tx) => {
    await tx.game.update({ where: { id }, data: { status: "APPROVED" } });
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
