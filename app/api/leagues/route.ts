import { NextResponse } from "next/server";

// Leagues replaced by game types (REC / CLUB / TOURNEY_REG / TOURNEY_MEDAL)
export async function GET() {
  return NextResponse.json([]);
}
