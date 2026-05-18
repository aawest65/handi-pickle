import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const METRIC_FIELDS = [
  "serveRating", "serveSpeed", "returnSkill", "defense", "offense",
  "lobbing", "dinking", "drops", "speedUps", "unforcedErrors",
] as const;

type MetricField = typeof METRIC_FIELDS[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  const [metrics, medalGames] = await Promise.all([
    prisma.playerMetrics.findUnique({
      where: { playerId },
      include: { coach: { select: { name: true } } },
    }),
    prisma.game.findMany({
      where: {
        gameType: "TOURNEY_MEDAL",
        status: "APPROVED",
        medalColor: { not: null },
        OR: [
          { team1Player1Id: playerId },
          { team1Player2Id: playerId },
          { team2Player1Id: playerId },
          { team2Player2Id: playerId },
        ],
      },
      select: {
        team1Player1Id: true, team1Player2Id: true,
        team2Player1Id: true, team2Player2Id: true,
        team1Score: true, team2Score: true,
        medalColor: true,
      },
    }),
  ]);

  let gold = 0, silver = 0, bronze = 0;
  for (const g of medalGames) {
    const onTeam1 = g.team1Player1Id === playerId || g.team1Player2Id === playerId;
    const won = onTeam1 ? g.team1Score > g.team2Score : g.team2Score > g.team1Score;
    if (g.medalColor === "GOLD") {
      if (won) gold++; else silver++;
    } else if (g.medalColor === "BRONZE" && won) {
      bronze++;
    }
  }

  return NextResponse.json({ metrics, medals: { gold, silver, bronze } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playerId } = await params;

  // Only the assigned coach (or a super admin) may update
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { assignedCoachId: true },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isAssignedCoach = player.assignedCoachId === session.user.id;
  if (!isSuperAdmin && !isAssignedCoach) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Partial<Record<MetricField, number | null>>;

  // Validate: all provided values must be 1.0–5.0 in 0.5 increments
  for (const field of METRIC_FIELDS) {
    const val = body[field];
    if (val === undefined || val === null) continue;
    if (typeof val !== "number" || val < 1.0 || val > 5.0 || (val * 2) % 1 !== 0) {
      return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 });
    }
  }

  const data: Partial<Record<MetricField, number | null>> & { coachId: string } = {
    coachId: session.user.id,
  };
  for (const field of METRIC_FIELDS) {
    if (field in body) data[field] = body[field] ?? null;
  }

  const [updated] = await prisma.$transaction([
    prisma.playerMetrics.upsert({
      where: { playerId },
      create: { playerId, ...data },
      update: data,
      include: { coach: { select: { name: true } } },
    }),
    prisma.playerMetricsHistory.create({
      data: { playerId, ...data },
    }),
  ]);

  return NextResponse.json(updated);
}
