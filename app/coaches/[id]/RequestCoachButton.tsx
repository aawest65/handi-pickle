"use client";

import { useState } from "react";

interface Props {
  coachProfileId: string;
  initialStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  isCurrentCoach: boolean;
}

export function RequestCoachButton({ coachProfileId, initialStatus, isCurrentCoach }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isCurrentCoach || status === "ACCEPTED") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-900/30 border border-teal-700/50 rounded-xl text-teal-400 text-sm font-semibold">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Your Coach
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-xl text-amber-400 text-sm font-semibold">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Request Pending
      </div>
    );
  }

  async function sendRequest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/coaches/${coachProfileId}/request`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setStatus("PENDING");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={sendRequest}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        {loading ? "Sending…" : status === "DECLINED" ? "Request Again" : "Request as Coach"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
