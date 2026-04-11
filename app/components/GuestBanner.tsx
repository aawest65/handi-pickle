"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const SHOW_ON = ["/leaderboard", "/players"];

export default function GuestBanner() {
  const { status } = useSession();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow =
    !dismissed &&
    status === "unauthenticated" &&
    SHOW_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:bottom-auto md:top-16 md:bottom-auto">
      <div className="bg-gradient-to-r from-teal-900/95 to-slate-900/95 backdrop-blur-sm border-t md:border-t-0 md:border-b border-teal-700/50 px-4 py-3 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-teal-300">Want to track your rating?</p>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Join HandiPick — free, takes 60 seconds.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-teal-300 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors"
            >
              Track My Rating
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
