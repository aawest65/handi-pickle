"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ClubAdmin {
  id: string;
  name: string | null;
  email: string | null;
}

interface Member {
  id: string;
  name: string;
  playerNumber: string;
  currentRating: number;
  gamesPlayed: number;
  gender: string;
}

interface ClubDetail {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  status: string;
  primaryAdmin: ClubAdmin | null;
  backupAdmin: ClubAdmin | null;
  players: Member[];
}

const INPUT       = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors";
const BTN_GHOST   = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

export default function ClubDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isAdmin      = session?.user?.role === "ADMIN" || isSuperAdmin;

  const [club, setClub]       = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Club admins available to assign (users with isClubAdmin=true)
  const [clubAdmins, setClubAdmins] = useState<ClubAdmin[]>([]);

  // Edit info form
  const [editForm, setEditForm]   = useState({ name: "", city: "", state: "", description: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // Admin assignment
  const [primaryId, setPrimaryId]     = useState<string>("");
  const [backupId, setBackupId]       = useState<string>("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError]   = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Member removal
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/clubs/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Forbidden"); return r.json(); })
      .then((d: ClubDetail) => {
        setClub(d);
        setEditForm({ name: d.name, city: d.city ?? "", state: d.state ?? "", description: d.description ?? "" });
        setPrimaryId(d.primaryAdmin?.id ?? "");
        setBackupId(d.backupAdmin?.id  ?? "");
      })
      .catch(() => setError("Club not found or access denied."))
      .finally(() => setLoading(false));

    // Load users eligible to be club admins
    fetch("/api/admin/users?limit=500")
      .then((r) => r.json())
      .then((users: { id: string; name: string | null; email: string | null; isClubAdmin: boolean }[]) => {
        setClubAdmins(users.filter((u) => u.isClubAdmin || isSuperAdmin));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    setEditSuccess(false);
    try {
      const res  = await fetch(`/api/admin/clubs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        editForm.name,
          city:        editForm.city,
          state:       editForm.state,
          description: editForm.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Failed to save"); return; }
      setClub((c) => c ? { ...c, ...data } : c);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch {
      setEditError("Network error");
    } finally {
      setEditSaving(false);
    }
  }

  async function saveAdmins(e: React.FormEvent) {
    e.preventDefault();
    if (primaryId && backupId && primaryId === backupId) {
      setAssignError("Primary and backup admin must be different people.");
      return;
    }
    setAssignSaving(true);
    setAssignError("");
    setAssignSuccess(false);
    try {
      const res  = await fetch(`/api/admin/clubs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryAdminId: primaryId || null,
          backupAdminId:  backupId  || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAssignError(data.error ?? "Failed to save"); return; }
      setClub((c) => c ? { ...c, primaryAdmin: data.primaryAdmin, backupAdmin: data.backupAdmin } : c);
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch {
      setAssignError("Network error");
    } finally {
      setAssignSaving(false);
    }
  }

  async function removeMember(player: Member) {
    setRemovingId(player.id);
    try {
      const res = await fetch(`/api/admin/clubs/${id}/members/${player.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed to remove"); return; }
      setClub((c) => c ? { ...c, players: c.players.filter((p) => p.id !== player.id) } : c);
      setRemoveTarget(null);
    } catch {
      alert("Network error");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400 mb-4">{error || "Club not found."}</p>
        <Link href="/admin/clubs" className="text-teal-400 hover:underline text-sm">← Back to Clubs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clubs" className="text-slate-400 hover:text-slate-200 text-sm">← Clubs</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{club.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {club.players.length} member{club.players.length !== 1 ? "s" : ""}
            {(club.city || club.state) && ` · ${[club.city, club.state].filter(Boolean).join(", ")}`}
          </p>
        </div>
      </div>

      {/* ── Club info ────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Club Info</h2>
        <form onSubmit={saveInfo} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Club Name *</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className={INPUT}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">City</label>
              <input value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} className={INPUT} placeholder="e.g. Austin" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">State</label>
              <input value={editForm.state} onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))} className={INPUT} placeholder="e.g. TX" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className={`${INPUT} resize-none`}
              rows={2}
              placeholder="Optional description"
            />
          </div>
          {editError && <p className="text-red-400 text-sm">{editError}</p>}
          <div className="flex items-center justify-end gap-3">
            {editSuccess && <span className="text-teal-400 text-sm">✓ Saved</span>}
            <button type="submit" disabled={editSaving || !editForm.name.trim()} className={BTN_PRIMARY}>
              {editSaving ? "Saving…" : "Save Info"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Admin assignment (ADMIN+ only) ───────────────────────────────── */}
      {isAdmin && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-1">Admin Assignment</h2>
          <p className="text-xs text-slate-500 mb-4">Only users with the Club Admin role can be assigned. Both slots are optional.</p>
          <form onSubmit={saveAdmins} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Primary Admin</label>
              <select value={primaryId} onChange={(e) => setPrimaryId(e.target.value)} className={INPUT}>
                <option value="">— Unassigned —</option>
                {clubAdmins
                  .filter((u) => u.id !== backupId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name ?? u.email} ({u.email})</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Backup Admin</label>
              <select value={backupId} onChange={(e) => setBackupId(e.target.value)} className={INPUT}>
                <option value="">— None —</option>
                {clubAdmins
                  .filter((u) => u.id !== primaryId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name ?? u.email} ({u.email})</option>
                  ))}
              </select>
            </div>
            {assignError && <p className="text-red-400 text-sm">{assignError}</p>}
            <div className="flex items-center justify-end gap-3">
              {assignSuccess && <span className="text-teal-400 text-sm">✓ Saved</span>}
              <button type="submit" disabled={assignSaving} className={BTN_PRIMARY}>
                {assignSaving ? "Saving…" : "Save Admins"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Member roster ────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
          Members ({club.players.length})
        </h2>

        {club.players.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left pb-2 text-slate-400 font-medium">Player</th>
                  <th className="text-center pb-2 text-slate-400 font-medium hidden sm:table-cell">Rating</th>
                  <th className="text-center pb-2 text-slate-400 font-medium hidden sm:table-cell">Games</th>
                  <th className="text-right pb-2 text-slate-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {club.players.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/50 last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-baseline gap-2">
                        <Link href={`/players/${p.id}`} className="font-medium text-slate-200 hover:text-teal-400 transition-colors">
                          {p.name}
                        </Link>
                        <span className="text-xs text-slate-500">{p.playerNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500">{p.gender === "MALE" ? "Male" : "Female"}</div>
                    </td>
                    <td className="py-2.5 text-center hidden sm:table-cell text-teal-400 font-semibold">
                      {p.currentRating.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-center hidden sm:table-cell text-slate-300">
                      {p.gamesPlayed}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setRemoveTarget(p)}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                      >
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

      {/* Remove member confirmation */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-2">Remove Member?</h2>
            <p className="text-slate-400 text-sm mb-5">
              <span className="text-slate-200 font-medium">{removeTarget.name}</span> will be removed from{" "}
              <span className="text-slate-200 font-medium">{club.name}</span>. Their player profile and match history are unaffected.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemoveTarget(null)} disabled={!!removingId} className={BTN_GHOST}>
                Cancel
              </button>
              <button
                onClick={() => removeMember(removeTarget)}
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
