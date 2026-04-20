import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManage(userId: string, clubId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  if (session.user?.role === "SUPER_ADMIN" || session.user?.role === "ADMIN") return true;
  if (session.user?.isClubAdmin) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { primaryAdminId: true, backupAdminId: true },
    });
    if (club && (club.primaryAdminId === userId || club.backupAdminId === userId)) return true;
  }
  return false;
}

// GET — list pending join requests for a club
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await canManage(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.clubJoinRequest.findMany({
    where: { clubId: id, status: "PENDING" },
    orderBy: { requestedAt: "asc" },
    select: {
      id: true,
      requestedAt: true,
      player: {
        select: {
          id: true,
          name: true,
          playerNumber: true,
          currentRating: true,
          selfRatedCategory: true,
          gamesPlayed: true,
        },
      },
    },
  });

  return NextResponse.json(requests);
}
