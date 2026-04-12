import { prisma } from "@/lib/prisma";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last  = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return (last[0] ?? "X").toUpperCase() + (first[0] ?? "X").toUpperCase();
}

export async function generatePlayerNumber(name: string): Promise<string> {
  const prefix = initials(name);
  for (let attempts = 0; attempts < 20; attempts++) {
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `${prefix}${digits}`;
    const existing = await prisma.player.findUnique({
      where: { playerNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  // Fallback: use timestamp suffix if all random attempts collide
  return `${prefix}${Date.now().toString().slice(-4)}`;
}
