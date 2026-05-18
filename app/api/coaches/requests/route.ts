import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: coach sees their incoming requests (PENDING only by default)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.coachRequest.findMany({
    where: { coachUserId: session.user.id, status: "PENDING" },
    orderBy: { requestedAt: "desc" },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          currentRating: true,
          city: true,
          state: true,
        },
      },
    },
  });

  return NextResponse.json(requests);
}
