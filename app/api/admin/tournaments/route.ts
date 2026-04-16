import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canCreate(role: string, isTournamentDirector: boolean) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || isTournamentDirector;
}

// GET /api/admin/tournaments — list all tournaments (ADMIN+ or Tournament Director)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { role, isTournamentDirector } = session.user as { role: string; isTournamentDirector: boolean };
  if (!canCreate(role, isTournamentDirector)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      status: true,
      format: true,
      gameType: true,
      startDate: true,
      endDate: true,
      maxParticipants: true,
      club: { select: { id: true, name: true } },
      directors: {
        select: { isPrimary: true, user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { registrations: true } },
    },
  });

  return NextResponse.json(tournaments);
}

// POST /api/admin/tournaments — create a tournament
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { role, isTournamentDirector, id: userId } = session.user as {
    role: string; isTournamentDirector: boolean; id: string;
  };
  if (!canCreate(role, isTournamentDirector)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    name: string;
    description?: string;
    location?: string;
    city?: string;
    state?: string;
    startDate: string;
    endDate: string;
    registrationOpenAt?: string;
    registrationCloseAt?: string;
    format?: string;
    gameType?: string;
    maxParticipants?: number;
    clubId?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Tournament name is required" }, { status: 400 });
  }
  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }
  if (new Date(body.endDate) < new Date(body.startDate)) {
    return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
  }

  const tournament = await prisma.tournament.create({
    data: {
      name:                body.name.trim(),
      description:         body.description?.trim()  || null,
      location:            body.location?.trim()      || null,
      city:                body.city?.trim()           || null,
      state:               body.state?.trim()          || null,
      startDate:           new Date(body.startDate),
      endDate:             new Date(body.endDate),
      registrationOpenAt:  body.registrationOpenAt  ? new Date(body.registrationOpenAt)  : null,
      registrationCloseAt: body.registrationCloseAt ? new Date(body.registrationCloseAt) : null,
      format:              body.format   ?? "ALL",
      gameType:            body.gameType ?? "TOURNEY_REG",
      maxParticipants:     body.maxParticipants ?? null,
      status:              "DRAFT",
      createdById:         userId,
      clubId:              body.clubId || null,
      // Auto-add creator as primary director
      directors: {
        create: { userId, isPrimary: true },
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      format: true,
      gameType: true,
      city: true,
      state: true,
      club: { select: { id: true, name: true } },
      directors: {
        select: { isPrimary: true, user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { registrations: true } },
    },
  });

  return NextResponse.json(tournament, { status: 201 });
}
