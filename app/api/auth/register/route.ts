import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password, termsAccepted, dataShareAccepted, emailConsent } = body;

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required." },
        { status: 400 }
      );
    }

    // Validate consent — both required fields must be true
    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service and Privacy Policy." },
        { status: 400 }
      );
    }
    if (!dataShareAccepted) {
      return NextResponse.json(
        { error: "You must agree to the data sharing terms." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Validate password minimum length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    const now = new Date();

    // Create user with consent timestamps
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        termsAcceptedAt:    termsAccepted    ? now : null,
        dataShareConsentAt: dataShareAccepted ? now : null,
        emailConsentAt:     emailConsent      ? now : null,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
