import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const name        = (formData.get("name")        as string | null)?.trim();
    const city        = (formData.get("city")        as string | null)?.trim() || null;
    const state       = (formData.get("state")       as string | null)?.trim() || null;
    const description = (formData.get("description") as string | null)?.trim() || null;
    const note        = (formData.get("note")        as string | null)?.trim() || null;
    const logoFile    =  formData.get("logo") as File | null;

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 });
    }

    // Check for an existing pending request by this user
    const existing = await prisma.clubRequest.findFirst({
      where: { requestedById: session.user.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending club request" },
        { status: 409 }
      );
    }

    // Check name isn't already taken by an active club or another pending request
    const [clubConflict, requestConflict] = await Promise.all([
      prisma.club.findUnique({ where: { name }, select: { id: true } }),
      prisma.clubRequest.findFirst({ where: { name, status: "PENDING" }, select: { id: true } }),
    ]);
    if (clubConflict) {
      return NextResponse.json({ error: "A club with that name already exists" }, { status: 409 });
    }
    if (requestConflict) {
      return NextResponse.json(
        { error: "A pending request for that club name already exists" },
        { status: 409 }
      );
    }

    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      if (!ALLOWED_TYPES.includes(logoFile.type)) {
        return NextResponse.json(
          { error: "Logo must be a JPEG, PNG, WebP, or GIF" },
          { status: 400 }
        );
      }
      if (logoFile.size > MAX_BYTES) {
        return NextResponse.json({ error: "Logo must be under 5 MB" }, { status: 400 });
      }
      const ext  = logoFile.type.split("/")[1].replace("jpeg", "jpg");
      const blob = await put(`club-logos/request-${Date.now()}.${ext}`, logoFile, {
        access: "public",
        allowOverwrite: true,
      });
      logoUrl = blob.url;
    }

    const clubRequest = await prisma.clubRequest.create({
      data: {
        name,
        city,
        state,
        description,
        logoUrl,
        note,
        requestedById: session.user.id,
      },
    });

    return NextResponse.json(clubRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/club-requests error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

// GET — user can check their own requests
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await prisma.clubRequest.findMany({
    where: { requestedById: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}
