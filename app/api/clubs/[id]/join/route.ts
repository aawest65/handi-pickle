import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [player, club] = await Promise.all([
    prisma.player.findUnique({ where: { userId: session.user.id }, select: { id: true, onboardingComplete: true } }),
    prisma.club.findUnique({ where: { id, status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  if (!player) return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
  if (!player.onboardingComplete) return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  await prisma.player.update({ where: { id: player.id }, data: { clubId: id } });
  return NextResponse.json({ success: true, clubName: club.name });
}
