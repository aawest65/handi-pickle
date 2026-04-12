import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/profile/settings — update player preferences
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { showAge?: boolean };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { player: { select: { id: true } } },
  });
  if (!user?.player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.showAge === "boolean") data.showAge = body.showAge;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id: user.player.id },
    data,
    select: { showAge: true },
  });

  return NextResponse.json(player);
}
