import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAnnouncementEmail } from "@/lib/email";

// POST /api/admin/broadcast
// Body: { subject, body, audienceType: "all" | "club", clubId?: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, body, audienceType, clubId } =
    await req.json() as { subject: string; body: string; audienceType: "all" | "club"; clubId?: string };

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }
  if (audienceType === "club" && !clubId) {
    return NextResponse.json({ error: "clubId is required for club audience" }, { status: 400 });
  }

  const where =
    audienceType === "club"
      ? { emailConsentAt: { not: null }, player: { memberships: { some: { clubId } } } }
      : { emailConsentAt: { not: null }, player: { isNot: null } };

  const recipients = await prisma.user.findMany({
    where,
    select: { email: true, name: true },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of recipients) {
    if (!user.email) { skipped++; continue; }
    try {
      await sendAnnouncementEmail(user.email, subject.trim(), body.trim());
      sent++;
    } catch (err) {
      errors.push(`${user.email}: ${String(err)}`);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
