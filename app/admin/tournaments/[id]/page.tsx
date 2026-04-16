"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Director {
  isPrimary: boolean;
  user: { id: string; name: string | null; email: string | null };
}

interface Registration {
  id: string;
  status: string;
  seed: number | null;
  registeredAt: string;
  player: { id: string; name: string; playerNumber: string; currentRating: number; gender: string };
}

interface TournamentDetail {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  status: string;
  format: string;
  gameType: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  maxParticipants: number | null;
  clubId: string | null;
  club: { id: string; name: string } | null;
  directors: Director[];
  registrations: Registration[];
}

interface EligibleDirector {
  id: string;
  name: string | null;
  email: string | null;
}

interface PlayerSearchResult {
  id: string;
  name: string;
  playerNumber: string;
  currentRating: number;
  gender: string;
}

const STATUSES = ["DRAFT", "REGISTRATION", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", REGISTRATION: "Registration", IN_PROGRESS: "In Progress",
  COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT:        "bg-slate-700 text-slate-300",
  REGISTRATION: "bg-sky-900/60 text-sky-300",
  IN_PROGRESS:  "bg-emerald-900/60 text-emerald-300",
  COMPLETED:    "bg-teal-900/60 text-teal-300",
  CANCELLED:    "bg-red-900/40 text-red-400",
};

const INPUT       = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors";
const BTN_GHOST   = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

export default function TournamentDetailPage() {
  const { id }            = useParams<{ id: string }>();
  const { data: session } = useSession();
  const role              = (session?.user as { role?: string })?.role ?? "";
  const isSuperAdmin      = role === "SUPER_ADMIN";
  const isAdmin           = role === "ADMIN" || isSuperAdmin;

  const [tournament, setTournament]   = useState<TournamentDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pageError, setPageError]     = useState("");

  // Info edit form
  const [info, setInfo]             = useState({ name: "", description: "", location: "", city: "", state: "",
    startDate: "", endDate: "", registrationOpenAt: "", registrationCloseAt: "",
    format: "ALL", gameType: "TOURNEY_REG", maxParticipants: "", status: "DRAFT" });
  const [infoSaving, setInfoSaving]   = useState(false);
  const [infoError, setInfoError]     = useState("");
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Directors
  const [eligibleDirectors, setEligibleDirectors] = useState<EligibleDirector[]>([]);
  const [addDirId, setAddDirId]       = useState("");
  const [dirSaving, setDirSaving]     = useState(false);
  const [dirError, setDirError]       = useState("");

  // Roster
  const [playerSearch, setPlayerSearch]   = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching]         = useState(false);
  const [addingId, setAddingId]           = useState<string | null>(null);
  const [removeTarget, setRemoveTarget]   = useState<Registration | null>(null);
  const [removingId, setRemovingId]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/tournaments/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: TournamentDetail) => {
        setTournament(d);
        setInfo({
          name:                d.name,
          description:         d.description         ?? "",
          location:            d.location            ?? "",
          city:                d.city                ?? "",
          state:               d.state               ?? "",
          startDate:           toInputDate(d.startDate),
          endDate:             toInputDate(d.endDate),
          registrationOpenAt:  toInputDate(d.registrationOpenAt),
          registrationCloseAt: toInputDate(d.registrationCloseAt),
          format:              d.format,
          gameType:            d.gameType,
          maxParticipants:     d.maxParticipants?.toString() ?? "",
          status:              d.status,
        });
      })
      .catch(() => setPageError("Tournament not found or access denied."))
      .finally(() => setLoading(false));

    // Load eligible directors
    if (isAdmin) {
      fetch("/api/admin/users?limit=500")
        .then(r => r.json())
        .then((users: { id: string; name: string | null; email: string | null; isTournamentDirector: boolean }[]) => {
          setEligibleDirectors(users.filter(u => u.isTournamentDirector || isSuperAdmin));
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Player search (debounced)
  useEffect(() => {
    if (playerSearch.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/players?q=${encodeURIComponent(playerSearch)}&limit=10`);
        const data = await res.json();
        // Filter out already-registered players
        const registeredIds = new Set(tournament?.registrations.map(r => r.player.id));
        setSearchResults((data.players ?? data).filter((p: PlayerSearchResult) => !registeredIds.has(p.id)));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerSearch, tournament?.registrations]);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoSaving(true);
    setInfoError("");
    setInfoSuccess(false);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                info.name,
          description:         info.description         || null,
          location:            info.location            || null,
          city:                info.city                || null,
          state:               info.state               || null,
          startDate:           info.startDate,
          endDate:             info.endDate,
          registrationOpenAt:  info.registrationOpenAt  || null,
          registrationCloseAt: info.registrationCloseAt || null,
          format:              info.format,
          gameType:            info.gameType,
          maxParticipants:     info.maxParticipants ? Number(info.maxParticipants) : null,
          status:              info.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setInfoError(data.error ?? "Failed to save"); return; }
      setTournament(t => t ? { ...t, ...data } : t);
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch {
      setInfoError("Network error");
    } finally {
      setInfoSaving(false);
    }
  }

  async function addDirector() {
    if (!addDirId) return;
    setDirSaving(true);
    setDirError("");
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addDirectorId: addDirId }),
      });
      const data = await res.json();
      if (!res.ok) { setDirError(data.error ?? "Failed to add"); return; }
      setTournament(t => t ? { ...t, directors: data.directors } : t);
      setAddDirId("");
    } catch {
      setDirError("Network error");
    } finally {
      setDirSaving(false);
    }
  }

  async function removeDirector(userId: string) {
    setDirSaving(true);
    setDirError("");
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeDirectorId: userId }),
      });
      const data = await res.json();
      if (!res.ok) { setDirError(data.error ?? "Failed to remove"); return; }
      setTournament(t => t ? { ...t, directors: data.directors } : t);
    } catch {
      setDirError("Network error");
    } finally {
      setDirSaving(false);
    }
  }

  async function setPrimary(userId: string) {
    const res = await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setPrimaryDirectorId: userId }),
    });
    const data = await res.json();
    if (res.ok) setTournament(t => t ? { ...t, directors: data.directors } : t);
  }

  async function addPlayer(player: PlayerSearchResult) {
    setAddingId(player.id);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed to add"); return; }
      setTournament(t => t ? { ...t, registrations: [...t.registrations, data] } : t);
      setPlayerSearch("");
      setSearchResults([]);
    } finally {
      setAddingId(null);
    }
  }

  async function removePlayer(reg: Registration) {
    setRemovingId(reg.player.id);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}/registrations?playerId=${reg.player.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed to remove"); return; }
      setTournament(t => t ? { ...t, registrations: t.registrations.filter(r => r.id !== reg.id) } : t);
      setRemoveTarget(null);
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (pageError || !tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400 mb-4">{pageError || "Tournament not found."}</p>
        <Link href="/admin/tournaments" className="text-teal-400 hover:underline text-sm">← Back to Tournaments</Link>
      </div>
    );
  }

  const assignedDirectorIds = new Set(tournament.directors.map(d => d.user.id));
  const availableToAdd = eligibleDirectors.filter(u => !assignedDirectorIds.has(u.id));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tournaments" className="text-slate-400 hover:text-slate-200 text-sm">← Tournaments</Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">{tournament.name}</h1>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLORS[tournament.status] ?? "bg-slate-700 text-slate-300"}`}>
              {STATUS_LABELS[tournament.status] ?? tournament.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {tournament.registrations.length} player{tournament.registrations.length !== 1 ? "s" : ""}
            {(tournament.city || tournament.state) && ` · ${[tournament.city, tournament.state].filter(Boolean).join(", ")}`}
          </p>
        </div>
      </div>

      {/* ── Tournament info ───────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Tournament Info</h2>
        <form onSubmit={saveInfo} className="space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select value={info.status} onChange={e => setInfo(f => ({ ...f, status: e.target.value }))} className={INPUT}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Participants</label>
              <input type="number" min="2" value={info.maxParticipants} onChange={e => setInfo(f => ({ ...f, maxParticipants: e.target.value }))} className={INPUT} placeholder="Unlimited" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Date *</label>
              <input type="date" value={info.startDate} onChange={e => setInfo(f => ({ ...f, startDate: e.target.value }))} className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Date *</label>
              <input type="date" value={info.endDate} onChange={e => setInfo(f => ({ ...f, endDate: e.target.value }))} className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Registration Opens</label>
              <input type="date" value={info.registrationOpenAt} onChange={e => setInfo(f => ({ ...f, registrationOpenAt: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Registration Closes</label>
              <input type="date" value={info.registrationCloseAt} onChange={e => setInfo(f => ({ ...f, registrationCloseAt: e.target.value }))} className={INPUT} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Format</label>
              <select value={info.format} onChange={e => setInfo(f => ({ ...f, format: e.target.value }))} className={INPUT}>
                <option value="ALL">All Formats</option>
                <option value="SINGLES">Singles</option>
                <option value="DOUBLES">Doubles</option>
                <option value="MIXED">Mixed Doubles</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Game Type</label>
              <select value={info.gameType} onChange={e => setInfo(f => ({ ...f, gameType: e.target.value }))} className={INPUT}>
                <option value="TOURNEY_REG">Regular</option>
                <option value="TOURNEY_MEDAL">Medal</option>
                <option value="BOTH">Reg + Medal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">City</label>
              <input value={info.city} onChange={e => setInfo(f => ({ ...f, city: e.target.value }))} className={INPUT} placeholder="e.g. Austin" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">State</label>
              <input value={info.state} onChange={e => setInfo(f => ({ ...f, state: e.target.value }))} className={INPUT} placeholder="TX" maxLength={2} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Venue / Location</label>
            <input value={info.location} onChange={e => setInfo(f => ({ ...f, location: e.target.value }))} className={INPUT} placeholder="e.g. Riverside Courts" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea value={info.description} onChange={e => setInfo(f => ({ ...f, description: e.target.value }))} className={`${INPUT} resize-none`} rows={2} placeholder="Optional" />
          </div>

          {infoError && <p className="text-red-400 text-sm">{infoError}</p>}
          <div className="flex items-center justify-end gap-3">
            {infoSuccess && <span className="text-teal-400 text-sm">✓ Saved</span>}
            <button type="submit" disabled={infoSaving || !info.name.trim()} className={BTN_PRIMARY}>
              {infoSaving ? "Saving…" : "Save Info"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Directors (ADMIN+ only) ───────────────────────────────────────── */}
      {isAdmin && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-1">Tournament Directors</h2>
          <p className="text-xs text-slate-500 mb-4">Primary director has full control. Both slots are optional beyond the first.</p>

          {/* Current directors */}
          <div className="space-y-2 mb-4">
            {tournament.directors.map(d => (
              <div key={d.user.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-slate-200">{d.user.name ?? d.user.email}</span>
                  {d.isPrimary && (
                    <span className="ml-2 text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded-full uppercase">Primary</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!d.isPrimary && (
                    <button onClick={() => setPrimary(d.user.id)} className="text-xs text-slate-400 hover:text-teal-400 transition-colors">
                      Make Primary
                    </button>
                  )}
                  <button onClick={() => removeDirector(d.user.id)} disabled={dirSaving} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add director */}
          {availableToAdd.length > 0 && (
            <div className="flex gap-2">
              <select value={addDirId} onChange={e => setAddDirId(e.target.value)} className={`${INPUT} flex-1`}>
                <option value="">— Add a director —</option>
                {availableToAdd.map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email} ({u.email})</option>
                ))}
              </select>
              <button onClick={addDirector} disabled={!addDirId || dirSaving} className={BTN_PRIMARY}>Add</button>
            </div>
          )}
          {dirError && <p className="text-red-400 text-sm mt-2">{dirError}</p>}
        </div>
      )}

      {/* ── Roster ───────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
          Roster ({tournament.registrations.length}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ""})
        </h2>

        {/* Add player search */}
        <div className="relative mb-4">
          <input
            value={playerSearch}
            onChange={e => setPlayerSearch(e.target.value)}
            className={INPUT}
            placeholder="Search players to add…"
          />
          {(searching || searchResults.length > 0) && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              {searching && <div className="px-3 py-2 text-sm text-slate-400">Searching…</div>}
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => addPlayer(p)}
                  disabled={addingId === p.id}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-slate-200">{p.name}</span>
                    <span className="text-xs text-slate-500 ml-2">{p.playerNumber}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {p.currentRating.toFixed(2)} · {p.gender === "MALE" ? "M" : "F"}
                    {addingId === p.id && <span className="ml-2 text-teal-400">Adding…</span>}
                  </div>
                </button>
              ))}
              {!searching && searchResults.length === 0 && playerSearch.length >= 2 && (
                <div className="px-3 py-2 text-sm text-slate-500">No players found</div>
              )}
            </div>
          )}
        </div>

        {/* Roster table */}
        {tournament.registrations.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No players registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left pb-2 text-slate-400 font-medium">Player</th>
                  <th className="text-center pb-2 text-slate-400 font-medium hidden sm:table-cell">Rating</th>
                  <th className="text-center pb-2 text-slate-400 font-medium hidden sm:table-cell">Seed</th>
                  <th className="text-right pb-2 text-slate-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tournament.registrations.map((reg, i) => (
                  <tr key={reg.id} className="border-b border-slate-700/50 last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-600 tabular-nums w-4">{i + 1}.</span>
                        <Link href={`/players/${reg.player.id}`} className="font-medium text-slate-200 hover:text-teal-400 transition-colors">
                          {reg.player.name}
                        </Link>
                        <span className="text-xs text-slate-500">{reg.player.playerNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-6">{reg.player.gender === "MALE" ? "Male" : "Female"}</div>
                    </td>
                    <td className="py-2.5 text-center hidden sm:table-cell text-teal-400 font-semibold">
                      {reg.player.currentRating.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-center hidden sm:table-cell text-slate-400">
                      {reg.seed ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => setRemoveTarget(reg)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remove player confirmation */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-2">Remove Player?</h2>
            <p className="text-slate-400 text-sm mb-5">
              <span className="text-slate-200 font-medium">{removeTarget.player.name}</span> will be removed from{" "}
              <span className="text-slate-200 font-medium">{tournament.name}</span>. Their player profile and rating history are unaffected.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemoveTarget(null)} disabled={!!removingId} className={BTN_GHOST}>Cancel</button>
              <button
                onClick={() => removePlayer(removeTarget)}
                disabled={!!removingId}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {removingId ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
