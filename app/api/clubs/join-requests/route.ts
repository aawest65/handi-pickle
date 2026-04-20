import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — returns the current player's own join requests (so the UI can show pending/rejected state)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) return NextResponse.json([]);

  const requests = await prisma.clubJoinRequest.findMany({
    where: { playerId: player.id },
    select: { clubId: true, status: true, requestedAt: true },
  });

  return NextResponse.json(requests);
}
