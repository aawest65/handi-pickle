import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canManageTournament(userId: string, tournamentId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  const { role } = session.user as { role: string };
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;

  // Tournament director assigned to this specific tournament
  const director = await prisma.tournamentDirector.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  });
  return !!director;
}

// GET /api/admin/tournaments/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id ?? "";
  if (!(await canManageTournament(userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      city: true,
      state: true,
      status: true,
      format: true,
      gameType: true,
      startDate: true,
      endDate: true,
      registrationOpenAt: true,
      registrationCloseAt: true,
      maxParticipants: true,
      clubId: true,
      club: { select: { id: true, name: true } },
      directors: {
        select: { isPrimary: true, user: { select: { id: true, name: true, email: true } } },
      },
      registrations: {
        orderBy: { registeredAt: "asc" },
        select: {
          id: true,
          status: true,
          seed: true,
          registeredAt: true,
          player: {
            select: {
              id: true,
              name: true,
              playerNumber: true,
              currentRating: true,
              gender: true,
            },
          },
        },
      },
    },
  });

  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tournament);
}

// PATCH /api/admin/tournaments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id ?? "";
  if (!(await canManageTournament(userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    name?: string;
    description?: string;
    location?: string;
    city?: string;
    state?: string;
    startDate?: string;
    endDate?: string;
    registrationOpenAt?: string | null;
    registrationCloseAt?: string | null;
    format?: string;
    gameType?: string;
    maxParticipants?: number | null;
    status?: string;
    clubId?: string | null;
    // Director management
    addDirectorId?: string;
    removeDirectorId?: string;
    setPrimaryDirectorId?: string;
  };

  if (body.name !== undefined && !body.name?.trim()) {
    return NextResponse.json({ error: "Tournament name cannot be empty" }, { status: 400 });
  }
  if (body.startDate && body.endDate && new Date(body.endDate) < new Date(body.startDate)) {
    return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
  }

  // Director operations (run separately from info update)
  if (body.addDirectorId) {
    const user = await prisma.user.findUnique({
      where: { id: body.addDirectorId },
      select: { isTournamentDirector: true },
    });
    if (!user?.isTournamentDirector && (session.user as { role: string }).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "User must have Tournament Director role" }, { status: 400 });
    }
    await prisma.tournamentDirector.upsert({
      where: { tournamentId_userId: { tournamentId: id, userId: body.addDirectorId } },
      create: { tournamentId: id, userId: body.addDirectorId, isPrimary: false },
      update: {},
    });
  }

  if (body.removeDirectorId) {
    // Don't remove the last primary director
    const existing = await prisma.tournamentDirector.findMany({ where: { tournamentId: id } });
    const isOnlyPrimary =
      existing.length === 1 ||
      (existing.find(d => d.userId === body.removeDirectorId)?.isPrimary &&
       existing.filter(d => d.isPrimary).length === 1);
    if (isOnlyPrimary) {
      return NextResponse.json({ error: "Cannot remove the only primary director" }, { status: 400 });
    }
    await prisma.tournamentDirector.delete({
      where: { tournamentId_userId: { tournamentId: id, userId: body.removeDirectorId } },
    });
  }

  if (body.setPrimaryDirectorId) {
    await prisma.$transaction([
      prisma.tournamentDirector.updateMany({ where: { tournamentId: id }, data: { isPrimary: false } }),
      prisma.tournamentDirector.update({
        where: { tournamentId_userId: { tournamentId: id, userId: body.setPrimaryDirectorId } },
        data: { isPrimary: true },
      }),
    ]);
  }

  // Info update
  const infoFields = ["name", "description", "location", "city", "state", "startDate", "endDate",
    "registrationOpenAt", "registrationCloseAt", "format", "gameType", "maxParticipants", "status", "clubId"];
  const hasInfoUpdate = infoFields.some(f => f in body);

  if (hasInfoUpdate) {
    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(body.name        !== undefined && { name:        body.name!.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.location    !== undefined && { location:    body.location?.trim()    || null }),
        ...(body.city        !== undefined && { city:        body.city?.trim()         || null }),
        ...(body.state       !== undefined && { state:       body.state?.trim()        || null }),
        ...(body.startDate   !== undefined && { startDate:   new Date(body.startDate) }),
        ...(body.endDate     !== undefined && { endDate:     new Date(body.endDate)   }),
        ...(body.registrationOpenAt  !== undefined && { registrationOpenAt:  body.registrationOpenAt  ? new Date(body.registrationOpenAt)  : null }),
        ...(body.registrationCloseAt !== undefined && { registrationCloseAt: body.registrationCloseAt ? new Date(body.registrationCloseAt) : null }),
        ...(body.format          !== undefined && { format:          body.format }),
        ...(body.gameType        !== undefined && { gameType:        body.gameType }),
        ...(body.maxParticipants !== undefined && { maxParticipants: body.maxParticipants ?? null }),
        ...(body.status          !== undefined && { status:          body.status }),
        ...(body.clubId          !== undefined && { clubId:          body.clubId ?? null }),
      },
      select: {
        id: true, name: true, description: true, location: true, city: true, state: true,
        status: true, format: true, gameType: true, startDate: true, endDate: true,
        registrationOpenAt: true, registrationCloseAt: true, maxParticipants: true, clubId: true,
        club: { select: { id: true, name: true } },
        directors: { select: { isPrimary: true, user: { select: { id: true, name: true, email: true } } } },
      },
    });
    return NextResponse.json(updated);
  }

  // Director-only change — return updated directors
  const directors = await prisma.tournamentDirector.findMany({
    where: { tournamentId: id },
    select: { isPrimary: true, user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ directors });
}

// DELETE /api/admin/tournaments/[id] — SUPER_ADMIN or primary director of a DRAFT tournament
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id ?? "";
  const role   = (session.user as { role: string }).role;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { status: true, directors: { select: { userId: true, isPrimary: true } } },
  });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPrimaryDirector = tournament.directors.some(d => d.userId === userId && d.isPrimary);
  if (role !== "SUPER_ADMIN" && !(isPrimaryDirector && tournament.status === "DRAFT")) {
    return NextResponse.json({ error: "Only the primary director can delete a draft tournament" }, { status: 403 });
  }

  await prisma.tournament.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
