"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Club {
  id:          string;
  name:        string;
  city:        string | null;
  state:       string | null;
  description: string | null;
}

const INPUT = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors";
const BTN_GHOST   = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

export default function AdminClubsPage() {
  const { data: session } = useSession();
  const isAdmin      = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [clubs, setClubs]     = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [name, setName]               = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating]       = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((d) => setClubs(d))
      .finally(() => setLoading(false));
  }, [isAdmin]);

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
      setClubs((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setCity(""); setState(""); setDescription("");
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-slate-400 hover:text-slate-200 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold text-slate-100">Club Management</h1>
      </div>

      {/* Create club form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Add New Club</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Club name *"
            className={INPUT}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={INPUT}
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className={INPUT}
            />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className={INPUT}
          />
          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={creating || !name.trim()} className={BTN_PRIMARY}>
              {creating ? "Creating…" : "Create Club"}
            </button>
          </div>
        </form>
      </div>

      {/* Club list */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
        {loading ? "Loading…" : `${clubs.length} Club${clubs.length !== 1 ? "s" : ""}`}
      </h2>

      {!loading && clubs.length === 0 && (
        <p className="text-slate-500 text-sm">No clubs yet. Create one above.</p>
      )}

      <div className="space-y-2">
        {clubs.map((club) => (
          <div key={club.id} className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-100 font-medium text-sm">{club.name}</p>
              {(club.city || club.state) && (
                <p className="text-slate-500 text-xs mt-0.5">
                  {[club.city, club.state].filter(Boolean).join(", ")}
                </p>
              )}
              {club.description && (
                <p className="text-slate-500 text-xs mt-0.5 italic">{club.description}</p>
              )}
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => { setDeleteTarget(club); setDeleteError(""); }}
                className="px-2.5 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 text-xs rounded-md border border-red-800/50 transition-colors shrink-0"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Delete Club?</h2>
            <p className="text-slate-400 text-sm mb-3">
              <span className="text-slate-200 font-medium">{deleteTarget.name}</span> will be removed.
              Players in this club will have their club affiliation cleared.
            </p>
            {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className={BTN_GHOST}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete Club"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
