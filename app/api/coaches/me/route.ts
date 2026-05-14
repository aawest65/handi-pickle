import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireCoach() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), userId: null };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isCoach: true } });
  if (!user?.isCoach) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), userId: null };
  return { error: null, userId: session.user.id };
}

export async function GET() {
  const { error, userId } = await requireCoach();
  if (error) return error;

  const profile = await prisma.coachProfile.findUnique({ where: { userId: userId! } });
  return NextResponse.json(profile ?? null);
}

export async function PUT(req: NextRequest) {
  const { error, userId } = await requireCoach();
  if (error) return error;

  const body = await req.json();
  const {
    bio, city, state, yearsCoaching,
    certifications, otherCerts, specialties,
    lessonRateMin, lessonRateMax, groupRate,
    website, phone, showPhone, isPublic,
  } = body;

  const data = {
    bio:          typeof bio === "string"          ? bio.trim() || null         : undefined,
    city:         typeof city === "string"         ? city.trim() || null        : undefined,
    state:        typeof state === "string"        ? state.trim() || null       : undefined,
    yearsCoaching: typeof yearsCoaching === "number" ? yearsCoaching            : yearsCoaching === null ? null : undefined,
    certifications: Array.isArray(certifications)  ? certifications             : undefined,
    otherCerts:   typeof otherCerts === "string"   ? otherCerts.trim() || null  : undefined,
    specialties:  Array.isArray(specialties)        ? specialties               : undefined,
    lessonRateMin: typeof lessonRateMin === "number" ? lessonRateMin            : lessonRateMin === null ? null : undefined,
    lessonRateMax: typeof lessonRateMax === "number" ? lessonRateMax            : lessonRateMax === null ? null : undefined,
    groupRate:    typeof groupRate === "string"    ? groupRate.trim() || null   : undefined,
    website:      typeof website === "string"      ? website.trim() || null     : undefined,
    phone:        typeof phone === "string"        ? phone.trim() || null       : undefined,
    showPhone:    typeof showPhone === "boolean"   ? showPhone                  : undefined,
    isPublic:     typeof isPublic === "boolean"    ? isPublic                   : undefined,
  };

  const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));

  const profile = await prisma.coachProfile.upsert({
    where:  { userId: userId! },
    create: { userId: userId!, ...cleaned },
    update: cleaned,
  });

  return NextResponse.json(profile);
}
