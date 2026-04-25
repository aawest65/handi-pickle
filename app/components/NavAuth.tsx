"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated" && session?.user) {
    const displayName = session.user.name ?? session.user.email ?? "Account";
    const isAdmin              = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    const isTournamentDirector = (session.user as { isTournamentDirector?: boolean })?.isTournamentDirector ?? false;
    const isClubAdmin          = (session.user as { isClubAdmin?: boolean })?.isClubAdmin ?? false;
    return (
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-yellow-400 hover:text-yellow-300 hover:bg-slate-800 transition-colors"
          >
            Admin
          </Link>
        )}
        {!isAdmin && isTournamentDirector && (
          <Link
            href="/admin/tournaments"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
          >
            Tournaments
          </Link>
        )}
        {!isAdmin && isClubAdmin && (
          <>
            <Link
              href="/admin/clubs"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
            >
              My Clubs
            </Link>
            <Link
              href="/admin/broadcast"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
            >
              Broadcast
            </Link>
          </>
        )}
        <Link
          href="/profile"
          className="text-sm text-slate-300 hover:text-teal-400 hidden sm:block truncate max-w-[140px] transition-colors"
        >
          {displayName}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-teal-400 hover:bg-slate-800 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/login"
        className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-teal-400 hover:bg-slate-800 transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="px-3 py-1.5 rounded-md text-sm font-medium bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors"
      >
        Register
      </Link>
    </div>
  );
}
