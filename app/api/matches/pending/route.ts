import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const playerSelect = { select: { id: true, name: true, avatarUrl: true } };

// GET — pending/flagged games where the current user is an opponent (not the submitter)
// Admins: pass ?all=1 to get all PENDING/FLAGGED/DISPUTED games for review
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "USER";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const all = req.nextUrl.searchParams.get("all") === "1";

  const gameSelect = {
    id: true,
    gameType: true,
    format: true,
    date: true,
    maxScore: true,
    team1Score: true,
    team2Score: true,
    status: true,
    createdAt: true,
    team1Player1: playerSelect,
    team1Player2: playerSelect,
    team2Player1: playerSelect,
    team2Player2: playerSelect,
    submittedBy: { select: { name: true } },
  };

  if (isAdmin && all) {
    const games = await prisma.game.findMany({
      where: { status: { in: ["PENDING", "FLAGGED", "DISPUTED"] } },
      orderBy: { createdAt: "desc" },
      select: gameSelect,
    });
    return NextResponse.json(games);
  }

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) return NextResponse.json([]);

  const games = await prisma.game.findMany({
    where: {
      status: { in: ["PENDING", "FLAGGED"] },
      submittedByUserId: { not: session.user.id },
      OR: [
        { team1Player1Id: player.id },
        { team1Player2Id: player.id },
        { team2Player1Id: player.id },
        { team2Player2Id: player.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: gameSelect,
  });

  return NextResponse.json(games);
}
