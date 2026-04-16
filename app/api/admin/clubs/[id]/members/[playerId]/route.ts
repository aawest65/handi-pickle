import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/clubs/[id]/members/[playerId] — remove player from club
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, playerId } = await params;
  const userId = session.user?.id ?? "";
  const role   = session.user?.role;

  // Must be SUPER_ADMIN, ADMIN, or the club's own primary/backup admin
  let allowed = role === "SUPER_ADMIN" || role === "ADMIN";
  if (!allowed && session.user?.isClubAdmin) {
    const club = await prisma.club.findUnique({
      where: { id },
      select: { primaryAdminId: true, backupAdminId: true },
    });
    allowed = !!(club && (club.primaryAdminId === userId || club.backupAdminId === userId));
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { clubId: true } });
  if (!player || player.clubId !== id) {
    return NextResponse.json({ error: "Player not in this club" }, { status: 404 });
  }

  await prisma.player.update({ where: { id: playerId }, data: { clubId: null } });
  return NextResponse.json({ success: true });
}
