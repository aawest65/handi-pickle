import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/players/[id]/reassign
// Body: { targetUserId: string, deleteOldUser?: boolean }
// Moves the player profile from its current user to targetUserId.
// If deleteOldUser=true and old user email ends in @example.com, old user is deleted.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: playerId } = await params;
  const { targetUserId, deleteOldUser = true } = await req.json() as {
    targetUserId: string;
    deleteOldUser?: boolean;
  };

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  // Verify player exists
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { user: true },
  });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Verify target user exists and doesn't already have a player
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { player: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }
  if (targetUser.player) {
    return NextResponse.json(
      { error: "Target user already has a player profile" },
      { status: 409 }
    );
  }

  const oldUserId = player.userId;
  const oldUserEmail = player.user.email ?? "";

  // Move the player to the new user and update the display name
  await prisma.player.update({
    where: { id: playerId },
    data: {
      userId: targetUserId,
      name: targetUser.name ?? player.name,
    },
  });

  // Delete placeholder user if requested and it's a placeholder email
  if (deleteOldUser && oldUserEmail.endsWith("@example.com")) {
    await prisma.user.delete({ where: { id: oldUserId } });
  }

  return NextResponse.json({ success: true, playerId, newUserId: targetUserId });
}
