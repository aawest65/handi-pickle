import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: coach accepts or declines a request
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId } = await params;
  const { action } = await req.json() as { action: "ACCEPTED" | "DECLINED" };

  if (action !== "ACCEPTED" && action !== "DECLINED") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const coachRequest = await prisma.coachRequest.findUnique({
    where: { id: requestId },
    select: { coachUserId: true, playerId: true, status: true },
  });

  if (!coachRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (coachRequest.coachUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (coachRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.coachRequest.update({
      where: { id: requestId },
      data: { status: action, reviewedAt: new Date() },
    });

    if (action === "ACCEPTED") {
      await tx.player.update({
        where: { id: coachRequest.playerId },
        data: { assignedCoachId: session.user.id },
      });
    }
  });

  return NextResponse.json({ status: action });
}
