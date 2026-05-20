import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const playerSelect = { select: { id: true, name: true } };

// GET — recent games submitted by the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const games = await prisma.game.findMany({
    where: { submittedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      gameType: true,
      format: true,
      date: true,
      team1Score: true,
      team2Score: true,
      status: true,
      createdAt: true,
      team1Player1: playerSelect,
      team1Player2: playerSelect,
      team2Player1: playerSelect,
      team2Player2: playerSelect,
    },
  });

  return NextResponse.json(games);
}
