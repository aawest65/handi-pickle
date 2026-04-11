import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const cookies = req.cookies.getAll();
  return NextResponse.json({
    session,
    cookieNames: cookies.map((c) => c.name),
  });
}
