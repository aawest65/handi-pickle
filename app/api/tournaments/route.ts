import { NextResponse } from "next/server";

// Tournaments replaced by game types (TOURNEY_REG / TOURNEY_MEDAL)
export async function GET() {
  return NextResponse.json([]);
}
