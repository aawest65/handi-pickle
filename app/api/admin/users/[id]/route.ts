import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// PATCH /api/admin/users/[id] — edit user + player details (SUPER_ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { name, email, selfRatedCategory, currentRating, isClubAdmin, isTournamentDirector } = await req.json();

  // Flag-only update (toggles from the role panel)
  if (isClubAdmin !== undefined || isTournamentDirector !== undefined) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(isClubAdmin          !== undefined && { isClubAdmin }),
        ...(isTournamentDirector !== undefined && { isTournamentDirector }),
      },
      select: {
        id: true, name: true, email: true, role: true,
        isClubAdmin: true, isTournamentDirector: true,
        player: { select: { id: true, playerNumber: true, currentRating: true, gamesPlayed: true, selfRatedCategory: true, onboardingComplete: true } },
      },
    });
    return NextResponse.json(updated);
  }

  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Update user record
  if (name || email) {
    const emailTaken = email && email !== user.email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
      : null;
    if (emailTaken) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    await prisma.user.update({
      where: { id },
      data: {
        ...(name  && { name:  name.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
      },
    });
  }

  // Update player record if one exists
  if (user.player && (name || selfRatedCategory || currentRating !== undefined)) {
    const validCategories = ["NOVICE", "INTERMEDIATE", "ADVANCED", "PRO"];
    if (selfRatedCategory && !validCategories.includes(selfRatedCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (currentRating !== undefined && (typeof currentRating !== "number" || currentRating < 1.0 || currentRating > 8.0)) {
      return NextResponse.json({ error: "Rating must be between 1.0 and 8.0" }, { status: 400 });
    }

    await prisma.player.update({
      where: { userId: id },
      data: {
        ...(name              && { name: name.trim() }),
        ...(selfRatedCategory && { selfRatedCategory }),
        ...(currentRating !== undefined && { currentRating }),
      },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      isClubAdmin: true, isTournamentDirector: true,
      player: { select: { id: true, playerNumber: true, currentRating: true, gamesPlayed: true, selfRatedCategory: true, onboardingComplete: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/users/[id] — delete user and their player record (SUPER_ADMIN only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;
  const session = await auth();

  if (id === session?.user?.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Player and related records cascade-delete via schema relations
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
