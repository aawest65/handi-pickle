import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/clubs — full club list with admin names + member count
// ADMIN/SUPER_ADMIN: all clubs; isClubAdmin: only clubs they admin
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isClubAdmin = session?.user?.isClubAdmin ?? false;

  if (!session || (!isAdmin && !isClubAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user?.id ?? "";

  const clubs = await prisma.club.findMany({
    where: isAdmin ? undefined : {
      OR: [
        { primaryAdminId: userId },
        { backupAdminId:  userId },
      ],
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      description: true,
      status: true,
      primaryAdmin: { select: { id: true, name: true, email: true } },
      backupAdmin:  { select: { id: true, name: true, email: true } },
      isPrivate: true,
      _count: { select: { memberships: true } },
    },
  });

  return NextResponse.json(clubs);
}
