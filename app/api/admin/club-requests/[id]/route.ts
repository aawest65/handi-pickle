import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — approve or reject a club request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = (await req.json()) as { action: "APPROVE" | "REJECT" };

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "action must be APPROVE or REJECT" }, { status: 400 });
  }

  const clubReq = await prisma.clubRequest.findUnique({ where: { id } });
  if (!clubReq) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (clubReq.status !== "PENDING") {
    return NextResponse.json({ error: "Request has already been reviewed" }, { status: 409 });
  }

  if (action === "REJECT") {
    const updated = await prisma.clubRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  // APPROVE: create the Club, move the logo, grant isClubAdmin, link request
  try {
    let clubLogoUrl = clubReq.logoUrl;

    // Rename blob from request-temp path to permanent club path (best-effort)
    // We just reuse the existing URL — no rename needed with Vercel Blob

    const [club] = await prisma.$transaction(async (tx) => {
      const newClub = await tx.club.create({
        data: {
          name:          clubReq.name,
          city:          clubReq.city,
          state:         clubReq.state,
          description:   clubReq.description,
          logoUrl:       clubLogoUrl,
          primaryAdminId: clubReq.requestedById,
        },
      });

      await tx.user.update({
        where: { id: clubReq.requestedById },
        data: { isClubAdmin: true },
      });

      await tx.clubRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date(), clubId: newClub.id },
      });

      return [newClub];
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A club with that name already exists" }, { status: 409 });
    }
    console.error("PATCH /api/admin/club-requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to approve request" }, { status: 500 });
  }
}

// DELETE — remove a rejected/pending request and its logo
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const clubReq = await prisma.clubRequest.findUnique({ where: { id } });
  if (!clubReq) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (clubReq.logoUrl) {
    try { await del(clubReq.logoUrl); } catch { /* non-fatal */ }
  }

  await prisma.clubRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
