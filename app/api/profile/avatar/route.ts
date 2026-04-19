import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/profile/avatar — upload a new avatar
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { player: { select: { id: true, avatarUrl: true } } },
    });
    if (!user?.player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }

    // Delete old avatar from Blob storage if one exists
    if (user.player.avatarUrl) {
      try {
        await del(user.player.avatarUrl);
      } catch {
        // Non-fatal — old file may already be gone
      }
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const blob = await put(`avatars/${user.player.id}.${ext}`, file, {
      access: "public",
      allowOverwrite: true,
    });

    await prisma.player.update({
      where: { id: user.player.id },
      data: { avatarUrl: blob.url },
    });

    return NextResponse.json({ avatarUrl: blob.url });
  } catch (error) {
    console.error("POST /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}

// DELETE /api/profile/avatar — remove avatar
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { player: { select: { id: true, avatarUrl: true } } },
    });
    if (!user?.player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (user.player.avatarUrl) {
      try {
        await del(user.player.avatarUrl);
      } catch {
        // Non-fatal
      }
    }

    await prisma.player.update({
      where: { id: user.player.id },
      data: { avatarUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/profile/avatar error:", error);
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 });
  }
}
