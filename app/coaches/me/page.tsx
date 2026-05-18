export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileEditor } from "./ProfileEditor";
import { PendingRequests } from "./PendingRequests";

export default async function MyCoachProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isCoach: true, coachProfile: true },
  });

  if (!user?.isCoach) redirect("/");

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-10">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">My Coach Profile</h1>
          <p className="text-slate-400 mt-1 text-sm">This is what players see when they find you in the directory.</p>
        </div>
        <ProfileEditor
          initialProfile={user.coachProfile}
          coachProfileId={user.coachProfile?.id ?? null}
        />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">Player Requests</h2>
        <p className="text-sm text-slate-400 mb-4">Players who want you as their coach.</p>
        <PendingRequests />
      </div>
    </div>
  );
}
