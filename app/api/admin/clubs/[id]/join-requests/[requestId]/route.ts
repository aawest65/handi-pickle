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

// PATCH — approve or reject a join request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clubId, requestId } = await params;
  if (!(await canManage(session.user.id, clubId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json() as { action: "approve" | "reject" };
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const joinRequest = await prisma.clubJoinRequest.findUnique({
    where: { id: requestId },
    select: { id: true, clubId: true, playerId: true, status: true },
  });

  if (!joinRequest || joinRequest.clubId !== clubId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (joinRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Request already reviewed" }, { status: 409 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.clubJoinRequest.update({
      where: { id: requestId },
      data: { status: newStatus, reviewedAt: new Date(), reviewedById: session.user.id },
    });

    if (action === "approve") {
      // Set the player's club and dismiss any other pending requests they have
      await tx.player.update({
        where: { id: joinRequest.playerId },
        data: { clubId },
      });
      await tx.clubJoinRequest.updateMany({
        where: {
          playerId: joinRequest.playerId,
          status: "PENDING",
          id: { not: requestId },
        },
        data: { status: "REJECTED", reviewedAt: new Date() },
      });
    }
  });

  return NextResponse.json({ success: true, status: newStatus });
}
