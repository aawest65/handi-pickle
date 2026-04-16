"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Director {
  isPrimary: boolean;
  user: { id: string; name: string | null; email: string | null };
}

interface Tournament {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: string;
  format: string;
  gameType: string;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  club: { id: string; name: string } | null;
  directors: Director[];
  _count: { registrations: number };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT:        "Draft",
  REGISTRATION: "Registration",
  IN_PROGRESS:  "In Progress",
  COMPLETED:    "Completed",
  CANCELLED:    "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT:        "bg-slate-700 text-slate-300",
  REGISTRATION: "bg-sky-900/60 text-sky-300",
  IN_PROGRESS:  "bg-emerald-900/60 text-emerald-300",
  COMPLETED:    "bg-teal-900/60 text-teal-300",
  CANCELLED:    "bg-red-900/40 text-red-400",
};

const FORMAT_LABELS: Record<string, string> = {
  ALL:     "All Formats",
  SINGLES: "Singles",
  DOUBLES: "Doubles",
  MIXED:   "Mixed Doubles",
};

const GAMETYPE_LABELS: Record<string, string> = {
  TOURNEY_REG:   "Regular",
  TOURNEY_MEDAL: "Medal",
  BOTH:          "Reg + Medal",
};

const INPUT       = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors";
const BTN_GHOST   = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

const EMPTY_FORM = {
  name: "", description: "", location: "", city: "", state: "",
  startDate: "", endDate: "", registrationOpenAt: "", registrationCloseAt: "",
  format: "ALL", gameType: "TOURNEY_REG", maxParticipants: "", clubId: "",
};

export default function TournamentsListPage() {
  const { data: session } = useSession();
  const role                 = (session?.user as { role?: string })?.role ?? "";
  const isTournamentDirector = (session?.user as { isTournamentDirector?: boolean })?.isTournamentDirector ?? false;
  const isSuperAdmin         = role === "SUPER_ADMIN";
  const isAdmin              = role === "ADMIN" || isSuperAdmin;

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);

  // Create modal
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

  useEffect(() => {
    fetch("/api/admin/tournaments")
      .then(r => r.json())
      .then(setTournaments)
      .finally(() => setLoading(false));
  }, []);

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                form.name,
          description:         form.description || undefined,
          location:            form.location    || undefined,
          city:                form.city        || undefined,
          state:               form.state       || undefined,
          startDate:           form.startDate,
          endDate:             form.endDate,
          registrationOpenAt:  form.registrationOpenAt  || undefined,
          registrationCloseAt: form.registrationCloseAt || undefined,
          format:              form.format,
          gameType:            form.gameType,
          maxParticipants:     form.maxParticipants ? Number(form.maxParticipants) : undefined,
          clubId:              form.clubId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to create"); return; }
      setTournaments(t => [data, ...t]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const total      = tournaments.length;
  const active     = tournaments.filter(t => t.status === "IN_PROGRESS" || t.status === "REGISTRATION").length;
  const totalPlayers = tournaments.reduce((s, t) => s + t._count.registrations, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tournaments</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage tournament events and rosters</p>
        </div>
        {(isAdmin || isTournamentDirector) && (
          <button onClick={() => setShowModal(true)} className={BTN_PRIMARY}>+ New Tournament</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: total },
          { label: "Active", value: active },
          { label: "Players Registered", value: totalPlayers },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-100">{value}</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Tournament list */}
      {tournaments.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700">
          <p className="text-lg font-medium">No tournaments yet</p>
          <p className="text-sm mt-1">Create your first tournament to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const primary = t.directors.find(d => d.isPrimary)?.user;
            const start   = new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const end     = new Date(t.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-100">{t.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLORS[t.status] ?? "bg-slate-700 text-slate-300"}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{start}{start !== end ? ` – ${end}` : ""}</span>
                      {(t.city || t.state) && <span>· {[t.city, t.state].filter(Boolean).join(", ")}</span>}
                      {t.club && <span>· {t.club.name}</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-3">
                      <span>{FORMAT_LABELS[t.format] ?? t.format}</span>
                      <span>·</span>
                      <span>{GAMETYPE_LABELS[t.gameType] ?? t.gameType}</span>
                      <span>·</span>
                      <span className="text-teal-400 font-medium">
                        {t._count.registrations}{t.maxParticipants ? `/${t.maxParticipants}` : ""} players
                      </span>
                      {primary && <span>· Dir: {primary.name ?? primary.email}</span>}
                    </div>
                  </div>
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="shrink-0 text-sm font-semibold text-teal-400 hover:text-teal-300 border border-teal-700 hover:border-teal-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl my-auto">
            <h2 className="text-lg font-bold text-slate-100 mb-4">New Tournament</h2>
            <form onSubmit={createTournament} className="space-y-3">

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tournament Name *</label>
                <input value={form.name} onChange={e => setField("name", e.target.value)} className={INPUT} placeholder="e.g. Spring Open 2026" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setField("startDate", e.target.value)} className={INPUT} required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setField("endDate", e.target.value)} className={INPUT} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Format</label>
                  <select value={form.format} onChange={e => setField("format", e.target.value)} className={INPUT}>
                    <option value="ALL">All Formats</option>
                    <option value="SINGLES">Singles</option>
                    <option value="DOUBLES">Doubles</option>
                    <option value="MIXED">Mixed Doubles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Game Type</label>
                  <select value={form.gameType} onChange={e => setField("gameType", e.target.value)} className={INPUT}>
                    <option value="TOURNEY_REG">Regular</option>
                    <option value="TOURNEY_MEDAL">Medal</option>
                    <option value="BOTH">Reg + Medal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">City</label>
                  <input value={form.city} onChange={e => setField("city", e.target.value)} className={INPUT} placeholder="e.g. Austin" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">State</label>
                  <input value={form.state} onChange={e => setField("state", e.target.value)} className={INPUT} placeholder="TX" maxLength={2} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Venue / Location</label>
                <input value={form.location} onChange={e => setField("location", e.target.value)} className={INPUT} placeholder="e.g. Riverside Courts" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Participants</label>
                <input type="number" min="2" value={form.maxParticipants} onChange={e => setField("maxParticipants", e.target.value)} className={INPUT} placeholder="Leave blank for unlimited" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Registration Opens</label>
                  <input type="date" value={form.registrationOpenAt} onChange={e => setField("registrationOpenAt", e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Registration Closes</label>
                  <input type="date" value={form.registrationCloseAt} onChange={e => setField("registrationCloseAt", e.target.value)} className={INPUT} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setField("description", e.target.value)} className={`${INPUT} resize-none`} rows={2} placeholder="Optional" />
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(""); }} className={BTN_GHOST}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.name.trim() || !form.startDate || !form.endDate} className={BTN_PRIMARY}>
                  {saving ? "Creating…" : "Create Tournament"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
