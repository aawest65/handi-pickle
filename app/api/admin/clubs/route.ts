import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/clubs — full club list with admin names + member count (ADMIN+)
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clubs = await prisma.club.findMany({
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
