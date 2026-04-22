import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function MyPlayerPage() {
  const session = await auth();
  const playerId = (session?.user as { playerId?: string | null })?.playerId;

  if (!playerId) {
    redirect("/login");
  }

  redirect(`/players/${playerId}`);
}
