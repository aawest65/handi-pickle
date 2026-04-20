import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManageClub(userId: string, clubId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  if (session.user?.role === "SUPER_ADMIN" || session.user?.role === "ADMIN") return true;

  // Club admin who is primary or backup admin of this specific club
  if (session.user?.isClubAdmin) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { primaryAdminId: true, backupAdminId: true },
    });
    if (club && (club.primaryAdminId === userId || club.backupAdminId === userId)) return true;
  }
  return false;
}

// GET /api/admin/clubs/[id] — full club detail with members and admins
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = session.user?.id ?? "";
  if (!(await canManageClub(userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      description: true,
      status: true,
      primaryAdmin: { select: { id: true, name: true, email: true } },
      backupAdmin:  { select: { id: true, name: true, email: true } },
      players: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          playerNumber: true,
          currentRating: true,
          gamesPlayed: true,
          gender: true,
          city: true,
          state: true,
          dateOfBirth: true,
          showAge: true,
        },
      },
    },
  });

  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(club);
}

// PATCH /api/admin/clubs/[id] — update club details and/or admin assignments
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = session.user?.id ?? "";
  if (!(await canManageClub(userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    name?: string;
    city?: string;
    state?: string;
    description?: string;
    primaryAdminId?: string | null;
    backupAdminId?: string | null;
  };

  // Validate admin assignments — must be users with isClubAdmin=true (SUPER_ADMIN bypass)
  const isSuperAdmin = session.user?.role === "SUPER_ADMIN";
  for (const field of ["primaryAdminId", "backupAdminId"] as const) {
    const val = body[field];
    if (val && !isSuperAdmin) {
      const target = await prisma.user.findUnique({ where: { id: val }, select: { isClubAdmin: true } });
      if (!target?.isClubAdmin) {
        return NextResponse.json({ error: `User must have Club Admin role to be assigned as ${field}` }, { status: 400 });
      }
    }
    if (body.primaryAdminId && body.backupAdminId && body.primaryAdminId === body.backupAdminId) {
      return NextResponse.json({ error: "Primary and backup admin must be different users" }, { status: 400 });
    }
  }

  if (body.name !== undefined && !body.name?.trim()) {
    return NextResponse.json({ error: "Club name cannot be empty" }, { status: 400 });
  }

  try {
    const updated = await prisma.club.update({
      where: { id },
      data: {
        ...(body.name        !== undefined && { name:        body.name.trim() }),
        ...(body.city        !== undefined && { city:        body.city?.trim()        || null }),
        ...(body.state       !== undefined && { state:       body.state?.trim()       || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.primaryAdminId !== undefined && { primaryAdminId: body.primaryAdminId || null }),
        ...(body.backupAdminId  !== undefined && { backupAdminId:  body.backupAdminId  || null }),
      },
      select: {
        id: true, name: true, city: true, state: true, description: true, status: true,
        primaryAdmin: { select: { id: true, name: true, email: true } },
        backupAdmin:  { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A club with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 });
  }
}

// DELETE — remove club (SUPER_ADMIN only); players' clubId cleared by FK cascade
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.club.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/clubs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete club" }, { status: 500 });
  }
}

