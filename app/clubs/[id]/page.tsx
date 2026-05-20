export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

async function getClub(id: string) {
  return prisma.club.findUnique({
    where: { id },
    include: {
      primaryAdmin: { select: { name: true, email: true } },
      backupAdmin:  { select: { name: true, email: true } },
      memberships: {
        include: {
          player: {
            select: {
              id: true,
              name: true,
              playerNumber: true,
              currentRating: true,
              avatarUrl: true,
              city: true,
              state: true,
              categoryRatings: {
                where: { gameCategory: "CLUB" },
                select: { format: true, rating: true, gamesPlayed: true, clubId: true },
              },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) notFound();

  const memberCount = club.memberships.length;
  const since = new Date(club.createdAt).getFullYear();

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10 px-3 md:px-4 space-y-6">

      {/* ── Club header card ──────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

        <div className="bg-[#1b3a2b] px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
            Handi-Pickle · Club Profile
          </span>
          {club.isPrivate && (
            <span className="text-xs border border-slate-500 text-slate-400 rounded-full px-2 py-0.5">Private</span>
          )}
        </div>

        <div className="p-5 md:p-6 flex gap-5 items-start">
          {/* Logo */}
          <div className="w-20 h-20 rounded-xl bg-slate-700 border border-slate-600 shrink-0 overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400 relative">
            {club.logoUrl ? (
              <Image src={club.logoUrl} alt={`${club.name} logo`} fill className="object-contain" sizes="80px" />
            ) : (
              club.name.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">{club.name}</h1>
            {(club.city || club.state) && (
              <p className="text-sm text-slate-400 mt-0.5">{[club.city, club.state].filter(Boolean).join(", ")}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">Est. {since} · {memberCount} member{memberCount !== 1 ? "s" : ""}</p>

            {club.description && (
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{club.description}</p>
            )}
          </div>
        </div>

        {/* Management row */}
        {(club.primaryAdmin || club.backupAdmin) && (
          <div className="border-t border-slate-700 px-5 md:px-6 py-4 flex flex-wrap gap-6">
            {club.primaryAdmin && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Club Manager</p>
                <p className="text-sm font-medium text-slate-200">{club.primaryAdmin.name ?? "—"}</p>
              </div>
            )}
            {club.backupAdmin && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Backup Manager</p>
                <p className="text-sm font-medium text-slate-200">{club.backupAdmin.name ?? "—"}</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard link */}
        <div className="border-t border-slate-700 px-5 md:px-6 py-3">
          <Link
            href={`/leaderboard?clubId=${club.id}`}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
          >
            View Club Leaderboard →
          </Link>
        </div>
      </div>

      {/* ── Members list ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-3">
          Members <span className="text-slate-500 font-normal text-base">({memberCount})</span>
        </h2>

        {memberCount === 0 ? (
          <div className="text-center py-12 border border-slate-700 rounded-xl text-slate-500 text-sm">
            No members yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Player</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">CD</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold tracking-widest text-slate-500">CMx</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">CS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {club.memberships.map(({ player, isPrimary }) => {
                  const initials = player.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const clubRatings = player.categoryRatings.filter((r) => r.clubId === id);
                  const cd  = clubRatings.find((r) => r.format === "DOUBLES");
                  const cmx = clubRatings.find((r) => r.format === "MIXED");
                  const cs  = clubRatings.find((r) => r.format === "SINGLES");

                  return (
                    <tr key={player.id} className="hover:bg-slate-800/60 transition-colors group">
                      <td className="px-4 py-3">
                        <Link href={`/players/${player.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-700 overflow-hidden flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0 relative">
                            {player.avatarUrl ? (
                              <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" sizes="32px" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-200 group-hover:text-teal-300 transition-colors truncate">
                              {player.name}
                              {isPrimary && (
                                <span className="ml-2 text-[10px] font-semibold text-teal-400 border border-teal-700 rounded-full px-1.5 py-0.5 align-middle">Home</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">#{player.playerNumber}</p>
                          </div>
                        </Link>
                      </td>
                      {[cd, cmx, cs].map((r, i) => (
                        <td key={i} className="text-center px-3 py-3">
                          {r && r.gamesPlayed > 0 ? (
                            <>
                              <p className="text-sm font-bold text-slate-100">{r.rating.toFixed(2)}</p>
                              <p className="text-[10px] text-slate-500">{r.gamesPlayed}g</p>
                            </>
                          ) : (
                            <span className="text-slate-700 font-medium">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
