"use client";

import { useState, useEffect } from "react";

interface League {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  leagueMatches: { id: string }[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  async function fetchLeagues() {
    setLoading(true);
    try {
      const res = await fetch("/api/leagues");
      const data = await res.json();
      setLeagues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeagues();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name || !season || !startDate) {
      setFormError("Name, season, and start date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          season,
          startDate,
          endDate: endDate || undefined,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create league");
      }

      setName("");
      setSeason("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setShowForm(false);
      await fetchLeagues();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create league");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Leagues</h1>
          <p className="text-slate-400 mt-1">Manage ongoing league seasons</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {showForm ? "Cancel" : "+ New League"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-200">Create League</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                League Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tuesday Night League"
                required
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Season *
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="Spring 2026"
                required
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional league description..."
              className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          {formError && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 disabled:text-teal-600 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {submitting ? "Creating..." : "Create League"}
          </button>
        </form>
      )}

      {/* League list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mr-3" />
          Loading...
        </div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-medium text-slate-300">No leagues yet</p>
          <p className="text-sm mt-2">Create your first league season to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-100 text-base leading-snug">
                    {league.name}
                  </h3>
                  <span className="inline-block mt-1 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    {league.season}
                  </span>
                </div>
                <span className="text-xs bg-teal-900/50 text-teal-300 border border-teal-700/50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {league.leagueMatches.length} match{league.leagueMatches.length !== 1 ? "es" : ""}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-1">
                <span className="text-slate-500">Start:</span> {formatDate(league.startDate)}
              </p>
              {league.endDate && (
                <p className="text-sm text-slate-400 mb-1">
                  <span className="text-slate-500">End:</span> {formatDate(league.endDate)}
                </p>
              )}
              {!league.endDate && (
                <span className="inline-block mt-1 text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-2 py-0.5 rounded">
                  Ongoing
                </span>
              )}
              {league.description && (
                <p className="text-sm text-slate-500 mt-3 border-t border-slate-700 pt-3 line-clamp-2">
                  {league.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
