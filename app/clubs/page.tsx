import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getClubs() {
  return prisma.club.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      description: true,
      logoUrl: true,
      _count: { select: { players: true } },
    },
  });
}

export default async function ClubsPage() {
  const clubs = await getClubs();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Clubs</h1>
          <p className="text-slate-400 mt-1">
            {clubs.length} registered club{clubs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clubs/request"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Request a Club
        </Link>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-20 border border-slate-700 rounded-xl">
          <p className="text-lg font-medium text-slate-300 mb-2">No clubs yet</p>
          <p className="text-slate-500 text-sm mb-6">Be the first to establish a club.</p>
          <Link
            href="/clubs/request"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Request a Club
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-start gap-4"
            >
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={`${club.name} logo`}
                  className="w-14 h-14 rounded-lg object-contain bg-slate-700 border border-slate-600 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-700 border border-slate-600 shrink-0 flex items-center justify-center text-slate-500 text-xl font-bold">
                  {club.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-100 truncate">{club.name}</h2>
                {(club.city || club.state) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[club.city, club.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {club.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{club.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  {club._count.players} member{club._count.players !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
