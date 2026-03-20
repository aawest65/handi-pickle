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
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-300 hidden sm:block truncate max-w-[140px]">
          {displayName}
        </span>
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
