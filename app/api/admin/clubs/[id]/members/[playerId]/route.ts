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

  const membership = await prisma.playerClub.findUnique({
    where: { playerId_clubId: { playerId, clubId: id } },
  });
  if (!membership) return NextResponse.json({ error: "Player not in this club" }, { status: 404 });

  await prisma.playerClub.delete({ where: { playerId_clubId: { playerId, clubId: id } } });

  if (membership.isPrimary) {
    const next = await prisma.playerClub.findFirst({ where: { playerId } });
    if (next) {
      await prisma.playerClub.update({
        where: { playerId_clubId: { playerId, clubId: next.clubId } },
        data: { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
