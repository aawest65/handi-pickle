"use client";

import { useState, useEffect } from "react";

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  createdAt: string;
  tournamentMatches: { id: string }[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  async function fetchTournaments() {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      setTournaments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name || !startDate) {
      setFormError("Name and start date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate: endDate || undefined,
          location: location || undefined,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create tournament");
      }

      setName("");
      setStartDate("");
      setEndDate("");
      setLocation("");
      setDescription("");
      setShowForm(false);
      await fetchTournaments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Tournaments</h1>
          <p className="text-slate-400 mt-1">Manage pickleball tournaments</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {showForm ? "Cancel" : "+ New Tournament"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-200">Create Tournament</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spring Open 2026"
                required
                className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
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
              placeholder="Optional tournament description..."
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
            {submitting ? "Creating..." : "Create Tournament"}
          </button>
        </form>
      )}

      {/* Tournament list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mr-3" />
          Loading...
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🥇</div>
          <p className="text-lg font-medium text-slate-300">No tournaments yet</p>
          <p className="text-sm mt-2">Create your first tournament to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-teal-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-slate-100 text-base leading-snug">{t.name}</h3>
                <span className="text-xs bg-teal-900/50 text-teal-300 border border-teal-700/50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {t.tournamentMatches.length} match{t.tournamentMatches.length !== 1 ? "es" : ""}
                </span>
              </div>

              {t.location && (
                <p className="text-sm text-slate-400 mb-1">
                  <span className="text-slate-500">Location:</span> {t.location}
                </p>
              )}
              <p className="text-sm text-slate-400 mb-1">
                <span className="text-slate-500">Start:</span> {formatDate(t.startDate)}
              </p>
              {t.endDate && (
                <p className="text-sm text-slate-400 mb-1">
                  <span className="text-slate-500">End:</span> {formatDate(t.endDate)}
                </p>
              )}
              {t.description && (
                <p className="text-sm text-slate-500 mt-3 border-t border-slate-700 pt-3 line-clamp-2">
                  {t.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
