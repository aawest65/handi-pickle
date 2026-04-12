import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/players/check?name=&dob=YYYY-MM-DD
// Returns any existing players whose name and date of birth both match.
// Used during onboarding to warn about potential duplicate accounts.
// Requires authentication (must be in the process of creating an account).
//
// TODO: When email is operational, this route should also send an admin alert
// email whenever a duplicate is detected, including the new user's email and
// the matching player's details.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  const dob  = searchParams.get("dob");

  if (!name || !dob) {
    return NextResponse.json({ duplicates: [] });
  }

  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) {
    return NextResponse.json({ duplicates: [] });
  }

  // Normalize the DOB to midnight UTC for comparison
  const dobStart = new Date(dob + "T00:00:00.000Z");
  const dobEnd   = new Date(dob + "T23:59:59.999Z");

  const matches = await prisma.player.findMany({
    where: {
      name: { equals: name, mode: "insensitive" },
      dateOfBirth: { gte: dobStart, lte: dobEnd },
      // Exclude the current user's own player record (re-entry during edit mode)
      user: { email: { not: session.user.email } },
    },
    select: {
      id: true,
      name: true,
      playerNumber: true,
    },
  });

  return NextResponse.json({ duplicates: matches });
}
