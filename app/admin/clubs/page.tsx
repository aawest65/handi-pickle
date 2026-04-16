"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminClub {
  id:          string;
  name:        string;
  city:        string | null;
  state:       string | null;
  description: string | null;
  status:      string;
  primaryAdmin: { id: string; name: string | null; email: string | null } | null;
  backupAdmin:  { id: string; name: string | null; email: string | null } | null;
  _count: { players: number };
}

const INPUT       = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors";
const BTN_GHOST   = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

export default function AdminClubsPage() {
  const { data: session } = useSession();
  const isAdmin      = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [clubs, setClubs]     = useState<AdminClub[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [name, setName]               = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating]       = useState(false);
  const [showCreate, setShowCreate]   = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<AdminClub | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  function loadClubs() {
    setLoading(true);
    fetch("/api/admin/clubs")
      .then((r) => r.json())
      .then((d) => setClubs(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (isAdmin) loadClubs(); }, [isAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res  = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, state, description }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Failed to create club"); return; }
      setShowCreate(false);
      setName(""); setCity(""); setState(""); setDescription("");
      loadClubs();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/clubs/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setDeleteError(d.error ?? "Failed to delete"); return; }
      setClubs((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Network error");
    } finally {
      setDeleting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Access restricted to admins.</p>
        <Link href="/admin" className="text-teal-400 hover:underline text-sm mt-4 inline-block">← Back to Admin</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-slate-200 text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold text-slate-100">Club Management</h1>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateError(""); }} className={BTN_PRIMARY}>
          + New Club
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Clubs",     value: clubs.length },
          { label: "Total Members",   value: clubs.reduce((s, c) => s + c._count.players, 0) },
          { label: "Clubs w/ Admin",  value: clubs.filter((c) => c.primaryAdmin).length },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-400">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Club list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-xl">
          No clubs yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <div key={club.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: club info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-100">{club.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-emerald-300">
                      {club.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {club._count.players} member{club._count.players !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {(club.city || club.state) && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      {[club.city, club.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {club.description && (
                    <p className="text-slate-500 text-xs mt-0.5 italic truncate max-w-md">{club.description}</p>
                  )}

                  {/* Admin assignments */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-xs text-slate-500">
                      Primary admin:{" "}
                      <span className={club.primaryAdmin ? "text-teal-400" : "text-amber-500"}>
                        {club.primaryAdmin?.name ?? "Unassigned"}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      Backup:{" "}
                      <span className={club.backupAdmin ? "text-slate-300" : "text-slate-600"}>
                        {club.backupAdmin?.name ?? "None"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/clubs/${club.id}`}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    Manage
                  </Link>
                  {isSuperAdmin && (
                    <button
                      onClick={() => { setDeleteTarget(club); setDeleteError(""); }}
                      className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-xs rounded-lg border border-red-800/50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-teal-400 mb-4">New Club</h2>
            {createError && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name *" className={INPUT} required />
              <div className="grid grid-cols-2 gap-3">
                <input value={city}  onChange={(e) => setCity(e.target.value)}  placeholder="City"  className={INPUT} />
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className={INPUT} />
              </div>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className={INPUT} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className={BTN_GHOST}>Cancel</button>
                <button type="submit" disabled={creating || !name.trim()} className={`flex-1 ${BTN_PRIMARY}`}>
                  {creating ? "Creating…" : "Create Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Delete Club?</h2>
            <p className="text-slate-400 text-sm mb-3">
              <span className="text-slate-200 font-medium">{deleteTarget.name}</span> will be permanently removed.
              {deleteTarget._count.players > 0 && (
                <span className="text-amber-400"> {deleteTarget._count.players} player{deleteTarget._count.players !== 1 ? "s" : ""} will have their club affiliation cleared.</span>
              )}
            </p>
            {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className={BTN_GHOST}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete Club"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
