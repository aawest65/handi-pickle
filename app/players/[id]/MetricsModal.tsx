"use client";

import { useState, useEffect, useRef } from "react";

interface Metrics {
  serveRating:    number | null;
  serveSpeed:     number | null;
  returnSkill:    number | null;
  defense:        number | null;
  offense:        number | null;
  lobbing:        number | null;
  dinking:        number | null;
  drops:          number | null;
  speedUps:       number | null;
  unforcedErrors: number | null;
  coach:          { name: string | null } | null;
  updatedAt:      string;
}

interface HistoryEntry {
  id:             string;
  createdAt:      string;
  coach:          { name: string | null } | null;
  serveRating:    number | null;
  serveSpeed:     number | null;
  returnSkill:    number | null;
  defense:        number | null;
  offense:        number | null;
  lobbing:        number | null;
  dinking:        number | null;
  drops:          number | null;
  speedUps:       number | null;
  unforcedErrors: number | null;
}

interface Medals { gold: number; silver: number; bronze: number }

interface Props {
  playerId:        string;
  isAssignedCoach: boolean;
}

const SKILL_ROWS: { field: keyof Omit<Metrics, "coach" | "updatedAt">; label: string; invertBar?: boolean }[] = [
  { field: "serveRating",    label: "Serve Rating"     },
  { field: "serveSpeed",     label: "Serve Speed"      },
  { field: "returnSkill",    label: "Return Skill"     },
  { field: "defense",        label: "Defense"          },
  { field: "offense",        label: "Offense"          },
  { field: "lobbing",        label: "Lobbing"          },
  { field: "dinking",        label: "Dinking"          },
  { field: "drops",          label: "Drops"            },
  { field: "speedUps",       label: "Speed-Ups"        },
  { field: "unforcedErrors", label: "Unforced Errors", invertBar: true },
];

const STEPS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

function RatingBar({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-slate-500 text-xs">Not rated</span>;
  const pct = ((value - 1) / 4) * 100;
  const barColor = invert
    ? pct > 66 ? "bg-red-500" : pct > 33 ? "bg-yellow-500" : "bg-teal-500"
    : pct > 66 ? "bg-teal-500" : pct > 33 ? "bg-yellow-500" : "bg-slate-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-300 w-6 text-right tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}

function TrendArrow({ current, previous, invert }: { current: number | null; previous: number | null; invert?: boolean }) {
  if (current === null || previous === null) return null;
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return <span className="text-slate-500 text-xs">→</span>;
  const improving = invert ? delta < 0 : delta > 0;
  return improving
    ? <span className="text-teal-400 text-xs font-bold">▲</span>
    : <span className="text-red-400 text-xs font-bold">▼</span>;
}

function StepSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
      className="bg-slate-700 border border-slate-600 text-slate-100 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
    >
      <option value="">—</option>
      {STEPS.map((s) => (
        <option key={s} value={s}>{s.toFixed(1)}</option>
      ))}
    </select>
  );
}

function HistoryEntryCard({ entry, prev }: { entry: HistoryEntry; prev: HistoryEntry | null }) {
  const coachChanged = prev !== null && (entry.coach?.name ?? null) !== (prev.coach?.name ?? null);

  return (
    <div className="border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          {entry.coach?.name && (
            <p className="text-xs text-slate-400 mt-0.5">By {entry.coach.name}</p>
          )}
        </div>
        {coachChanged && (
          <span className="text-[10px] font-semibold tracking-wide text-amber-400 border border-amber-500/40 bg-amber-500/10 rounded-full px-2 py-0.5 whitespace-nowrap">
            Coach changed
          </span>
        )}
      </div>

      <div className="space-y-2">
        {SKILL_ROWS.map(({ field, label, invertBar }) => {
          const val = (entry as unknown as Record<string, number | null>)[field] ?? null;
          const prevVal = prev ? (prev as unknown as Record<string, number | null>)[field] ?? null : null;
          return (
            <div key={field} className="grid grid-cols-[110px_1fr_16px] items-center gap-2">
              <span className="text-xs text-slate-400">{label}</span>
              <RatingBar value={val} invert={invertBar} />
              <TrendArrow current={val} previous={prevVal} invert={invertBar} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MetricsButton({ playerId, isAssignedCoach }: Props) {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<"current" | "history">("current");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [medals, setMedals]   = useState<Medals>({ gold: 0, silver: 0, bronze: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState<Partial<Record<keyof Omit<Metrics, "coach" | "updatedAt">, number | null>>>({});
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const dialogRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/players/${playerId}/metrics`)
      .then((r) => r.json())
      .then(({ metrics: m, medals: med }) => {
        setMetrics(m);
        setMedals(med);
      })
      .finally(() => setLoading(false));
  }, [open, playerId]);

  useEffect(() => {
    if (!open || tab !== "history") return;
    setHistLoading(true);
    fetch(`/api/players/${playerId}/metrics/history`)
      .then((r) => r.json())
      .then(setHistory)
      .finally(() => setHistLoading(false));
  }, [open, tab, playerId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function startEdit() {
    if (!metrics) {
      setDraft({});
    } else {
      const d: typeof draft = {};
      for (const { field } of SKILL_ROWS) d[field] = (metrics as unknown as Record<string, number | null>)[field] ?? null;
      setDraft(d);
    }
    setEditing(true);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${playerId}/metrics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Save failed");
      }
      const updated = await res.json();
      setMetrics(updated);
      setEditing(false);
      // Invalidate cached history so it reloads fresh next time
      setHistory([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setOpen(false);
    setEditing(false);
    setTab("current");
  }

  const hasMedals = medals.gold + medals.silver + medals.bronze > 0;
  const hasMetrics = metrics && SKILL_ROWS.some(({ field }) => (metrics as unknown as Record<string, number | null>)[field] !== null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center px-2 py-2 md:px-4 min-w-0 hover:bg-slate-700/50 transition-colors group"
      >
        <div className="text-[9px] md:text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1 text-center leading-tight">
          Metrics
        </div>
        <svg className="w-5 h-5 text-teal-400 group-hover:text-teal-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            ref={dialogRef}
            className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-slate-100">Player Metrics</h2>
              <button onClick={close} className="text-slate-500 hover:text-slate-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              {(["current", "history"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setEditing(false); }}
                  className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                    tab === t
                      ? "text-teal-400 border-b-2 border-teal-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center text-slate-400">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            ) : tab === "current" ? (
              <div className="px-5 py-4 space-y-5">

                {/* Medals */}
                <div>
                  <h3 className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-3">Tournament Medals</h3>
                  {hasMedals ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Gold",   count: medals.gold,   emoji: "🥇", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" },
                        { label: "Silver", count: medals.silver, emoji: "🥈", color: "border-slate-400/40 bg-slate-500/10 text-slate-300"   },
                        { label: "Bronze", count: medals.bronze, emoji: "🥉", color: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
                      ].map(({ label, count, emoji, color }) => (
                        <div key={label} className={`flex flex-col items-center py-3 rounded-xl border ${color}`}>
                          <span className="text-2xl mb-1">{emoji}</span>
                          <span className="text-xl font-bold">{count}</span>
                          <span className="text-xs mt-0.5 opacity-75">{label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No medals recorded yet.</p>
                  )}
                </div>

                <div className="border-t border-slate-700" />

                {/* Skill metrics */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Coach Assessment</h3>
                    {!editing && isAssignedCoach && (
                      <button
                        onClick={startEdit}
                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
                      >
                        {hasMetrics ? "Edit" : "Add Ratings"}
                      </button>
                    )}
                  </div>

                  {metrics?.coach && metrics.updatedAt && !editing && (
                    <p className="text-xs text-slate-500 mb-3">
                      Last updated{" "}
                      {new Date(metrics.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {metrics.coach.name ? ` · By ${metrics.coach.name}` : ""}
                    </p>
                  )}

                  {editing ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-1">Scale: 1.0 (low) → 5.0 (high). For Unforced Errors, lower is better.</p>
                      {SKILL_ROWS.map(({ field, label }) => (
                        <div key={field} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-300 w-36 shrink-0">{label}</span>
                          <StepSelect
                            value={draft[field] ?? null}
                            onChange={(v) => setDraft((d) => ({ ...d, [field]: v }))}
                          />
                        </div>
                      ))}
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={save}
                          disabled={saving}
                          className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => { setEditing(false); setError(null); }}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : hasMetrics ? (
                    <div className="space-y-2.5">
                      {SKILL_ROWS.map(({ field, label, invertBar }) => (
                        <div key={field} className="grid grid-cols-[120px_1fr] items-center gap-3">
                          <span className="text-xs text-slate-400">{label}</span>
                          <RatingBar value={(metrics as unknown as Record<string, number | null>)[field] ?? null} invert={invertBar} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      {isAssignedCoach ? 'Click "Add Ratings" to enter your assessment.' : "No coach assessment yet."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* History tab */
              <div className="px-5 py-4">
                {histLoading ? (
                  <div className="py-12 flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-12">No assessment history yet.</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      {history.length} assessment{history.length !== 1 ? "s" : ""} · most recent first.
                      Arrows show change from the previous assessment.
                    </p>
                    {history.map((entry, i) => (
                      <HistoryEntryCard
                        key={entry.id}
                        entry={entry}
                        prev={history[i + 1] ?? null}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
