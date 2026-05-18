import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  const history = await prisma.playerMetricsHistory.findMany({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    include: { coach: { select: { name: true } } },
  });

  return NextResponse.json(history);
}
