"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface RequestItem {
  id: string;
  requestedAt: string;
  player: {
    id: string;
    name: string;
    avatarUrl: string | null;
    currentRating: number;
    city: string | null;
    state: string | null;
  };
}

export function PendingRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coaches/requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  async function respond(requestId: string, action: "ACCEPTED" | "DECLINED") {
    setActing(requestId);
    try {
      const res = await fetch(`/api/coaches/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-slate-500 text-sm">
        Loading requests…
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">No pending requests.</p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center gap-4 bg-slate-750 border border-slate-700 rounded-xl p-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-teal-900 border border-teal-700 overflow-hidden flex items-center justify-center text-sm font-bold text-teal-300 shrink-0 relative">
            {r.player.avatarUrl ? (
              <Image src={r.player.avatarUrl} alt={r.player.name} fill className="object-cover" sizes="40px" />
            ) : (
              r.player.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/players/${r.player.id}`} className="text-sm font-semibold text-slate-100 hover:text-teal-300 transition-colors truncate block">
              {r.player.name}
            </Link>
            <p className="text-xs text-slate-400">
              Rating {r.player.currentRating.toFixed(2)}
              {(r.player.city || r.player.state) && ` · ${[r.player.city, r.player.state].filter(Boolean).join(", ")}`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Requested {new Date(r.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => respond(r.id, "ACCEPTED")}
              disabled={acting === r.id}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => respond(r.id, "DECLINED")}
              disabled={acting === r.id}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
