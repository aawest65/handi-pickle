import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/clubs", process.env.NEXTAUTH_URL ?? "https://www.handipickle.com"));
}
