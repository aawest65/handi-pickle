import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/auth/consent
// Saves legal consent for users who signed up via Google (bypassed registration form)
// Body: { termsAccepted: boolean, dataShareAccepted: boolean, emailConsent: boolean }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { termsAccepted, dataShareAccepted, emailConsent } = await req.json() as {
    termsAccepted: boolean;
    dataShareAccepted: boolean;
    emailConsent: boolean;
  };

  if (!termsAccepted) {
    return NextResponse.json({ error: "You must accept the Terms of Service and Privacy Policy." }, { status: 400 });
  }
  if (!dataShareAccepted) {
    return NextResponse.json({ error: "You must agree to the data sharing terms." }, { status: 400 });
  }

  const now = new Date();

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      termsAcceptedAt:    now,
      dataShareConsentAt: now,
      emailConsentAt:     emailConsent ? now : null,
    },
  });

  return NextResponse.json({ success: true });
}
