import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/admin/users/[id]/reset-link
// Generates a password reset token for the user and returns the reset URL.
// The caller (admin) is responsible for sharing the link with the user.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  // Generate a new token valid for 24 hours
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, userId, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.handipickle.com";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  return NextResponse.json({ resetUrl, expiresAt });
}
