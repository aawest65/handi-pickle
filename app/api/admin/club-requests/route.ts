import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const requests = await prisma.clubRequest.findMany({
    where: status === "ALL" ? undefined : { status },
    orderBy: { createdAt: "asc" },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      club: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(requests);
}
