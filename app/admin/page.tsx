"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  player: {
    id: string;
    currentRating: number;
    gamesPlayed: number;
    selfRatedCategory: string;
    onboardingComplete: boolean;
  } | null;
}

const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-slate-700 text-slate-300",
  ADMIN: "bg-blue-900/50 text-blue-300 border border-blue-700/50",
  SUPER_ADMIN: "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50",
};

const CATEGORIES = [
  { value: "NOVICE",       label: "Novice",       rating: 2.0 },
  { value: "INTERMEDIATE", label: "Intermediate", rating: 3.5 },
  { value: "ADVANCED",     label: "Advanced",     rating: 4.5 },
  { value: "PRO",          label: "Pro",          rating: 6.0 },
] as const;

const INPUT = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors";
const BTN_GHOST = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

export default function AdminPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isAdmin = session?.user?.role === "ADMIN" || isSuperAdmin;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Add player form state
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", gender: "MALE", dateOfBirth: "", selfRatedCategory: "NOVICE", email: "", overrideRating: "",
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit rating state
  const [editRatingPlayerId, setEditRatingPlayerId] = useState<string | null>(null);
  const [editRatingValue, setEditRatingValue] = useState("");
  const [editRatingLoading, setEditRatingLoading] = useState(false);
  const [editRatingError, setEditRatingError] = useState("");

  // Reset link state
  const [resetLinkUserId, setResetLinkUserId] = useState<string | null>(null);
  const [resetLinkCopied, setResetLinkCopied] = useState<string | null>(null);

  // Reassign player state
  const [showReassign, setShowReassign] = useState(false);
  const [reassignPlayerId, setReassignPlayerId] = useState("");
  const [reassignTargetUserId, setReassignTargetUserId] = useState("");
  const [reassignError, setReassignError] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);

  function loadUsers() {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => { setError("Failed to load users."); setLoading(false); });
  }

  useEffect(() => { loadUsers(); }, []);

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: updated.role } : u));
    } catch {
      setError("Failed to update role.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const payload: Record<string, unknown> = { ...addForm };
      if (addForm.overrideRating) payload.overrideRating = parseFloat(addForm.overrideRating);
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed to create player"); return; }
      setShowAddPlayer(false);
      setAddForm({ name: "", gender: "MALE", dateOfBirth: "", selfRatedCategory: "NOVICE", email: "", overrideRating: "" });
      loadUsers();
    } catch {
      setAddError("Network error");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEditRating(playerId: string) {
    const val = parseFloat(editRatingValue);
    if (isNaN(val) || val < 1.0 || val > 8.0) {
      setEditRatingError("Rating must be between 1.0 and 8.0");
      return;
    }
    setEditRatingLoading(true);
    setEditRatingError("");
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentRating: val }),
      });
      const data = await res.json();
      if (!res.ok) { setEditRatingError(data.error ?? "Failed to update"); return; }
      setUsers((prev) => prev.map((u) =>
        u.player?.id === playerId
          ? { ...u, player: { ...u.player!, currentRating: data.currentRating } }
          : u
      ));
      setEditRatingPlayerId(null);
    } catch {
      setEditRatingError("Network error");
    } finally {
      setEditRatingLoading(false);
    }
  }

  async function handleReassign(e: React.FormEvent) {
    e.preventDefault();
    setReassignError("");
    setReassignLoading(true);
    try {
      const res = await fetch(`/api/admin/players/${reassignPlayerId}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: reassignTargetUserId, deleteOldUser: true }),
      });
      const data = await res.json();
      if (!res.ok) { setReassignError(data.error ?? "Failed to reassign"); return; }
      setShowReassign(false);
      setReassignPlayerId("");
      setReassignTargetUserId("");
      loadUsers();
    } catch {
      setReassignError("Network error");
    } finally {
      setReassignLoading(false);
    }
  }

  async function handleCopyResetLink(userId: string) {
    setResetLinkUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed to generate link"); return; }
      await navigator.clipboard.writeText(data.resetUrl);
      setResetLinkCopied(userId);
      setTimeout(() => setResetLinkCopied(null), 3000);
    } catch {
      alert("Failed to copy link");
    } finally {
      setResetLinkUserId(null);
    }
  }

  const playersWithUsers = users.filter((u) => u.player);
  const usersWithoutPlayer = users.filter((u) => !u.player);
  const selectedPlayerUser = users.find((u) => u.player?.id === reassignPlayerId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage users and roles · You are a{" "}
            <span className="text-yellow-400 font-medium">{ROLE_LABELS[session?.user?.role ?? "USER"]}</span>
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => { setShowReassign(true); setReassignError(""); }} className={BTN_GHOST}>
              Reassign Player
            </button>
            <button onClick={() => { setShowAddPlayer(true); setAddError(""); }} className={BTN_PRIMARY}>
              + Add Player
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">{error}</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Users",     value: users.length },
          { label: "Admins",          value: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length },
          { label: "Active Players",  value: users.filter((u) => u.player?.onboardingComplete).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-400">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Rating</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Games</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className={`border-b border-slate-800 ${idx % 2 === 0 ? "bg-slate-900/60" : "bg-slate-800/20"}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200 truncate max-w-[200px]">{user.name ?? "—"}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{user.email}</div>
                    {user.email?.endsWith("@example.com") && (
                      <span className="text-xs text-amber-400">Placeholder account</span>
                    )}
                    {user.player && !user.player.onboardingComplete && (
                      <span className="text-xs text-amber-500">Incomplete onboarding</span>
                    )}
                    {!user.email?.endsWith("@example.com") && (
                      <button
                        onClick={() => handleCopyResetLink(user.id)}
                        disabled={resetLinkUserId === user.id}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50 mt-0.5"
                      >
                        {resetLinkCopied === user.id ? "✓ Link copied!" : resetLinkUserId === user.id ? "Generating…" : "Copy reset link"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {user.player ? (
                      editRatingPlayerId === user.player.id ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            step="0.05"
                            min="1.0"
                            max="8.0"
                            value={editRatingValue}
                            onChange={(e) => setEditRatingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditRating(user.player!.id);
                              if (e.key === "Escape") { setEditRatingPlayerId(null); setEditRatingError(""); }
                            }}
                            className="w-20 bg-slate-800 border border-teal-500 text-slate-100 rounded px-2 py-1 text-xs text-center focus:outline-none"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditRating(user.player!.id)}
                              disabled={editRatingLoading}
                              className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                            >{editRatingLoading ? "…" : "Save"}</button>
                            <button
                              onClick={() => { setEditRatingPlayerId(null); setEditRatingError(""); }}
                              className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                            >Cancel</button>
                          </div>
                          {editRatingError && (
                            <div className="text-red-400 text-xs">{editRatingError}</div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (isSuperAdmin) {
                              setEditRatingPlayerId(user.player!.id);
                              setEditRatingValue(user.player!.currentRating.toFixed(2));
                              setEditRatingError("");
                            }
                          }}
                          className={`font-semibold text-teal-400 ${isSuperAdmin ? "hover:text-teal-300 underline decoration-dotted cursor-pointer" : "cursor-default"}`}
                          title={isSuperAdmin ? "Click to edit rating" : undefined}
                        >
                          {user.player.currentRating.toFixed(2)}
                        </button>
                      )
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-slate-300">
                    {user.player?.gamesPlayed ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isSuperAdmin && user.id !== session?.user?.id ? (
                      <select
                        value={user.role}
                        disabled={updating === user.id}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Player Modal ── */}
      {showAddPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-teal-400 mb-1">Add Player</h2>
            <p className="text-xs text-slate-500 mb-5">
              Creates a placeholder account ({"{name}"}@example.com) immediately active for match recording.
              The real player can claim it later via Reassign Player.
            </p>

            {addError && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">{addError}</div>
            )}

            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className={INPUT}
                  placeholder="e.g. John Smith"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Gender *</label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
                    className={INPUT}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={addForm.dateOfBirth}
                    onChange={(e) => setAddForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    max={new Date().toISOString().split("T")[0]}
                    min="1924-01-01"
                    className={INPUT}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Skill Level *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setAddForm((f) => ({ ...f, selfRatedCategory: cat.value }))}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                        addForm.selfRatedCategory === cat.value
                          ? "border-teal-500 bg-teal-900/30 text-slate-100"
                          : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <div className="font-semibold">{cat.label}</div>
                      <div className="text-teal-400 mt-0.5">Starting: {cat.rating.toFixed(1)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Email <span className="text-slate-600">(optional — auto-generated if blank)</span>
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className={INPUT}
                  placeholder="auto: firstname.lastname@example.com"
                />
              </div>

              {isSuperAdmin && (
                <div className="border-t border-slate-700 pt-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Override Starting Rating
                    <span className="text-slate-600 ml-1">(optional — leave blank to use category default)</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="8.0"
                    value={addForm.overrideRating}
                    onChange={(e) => setAddForm((f) => ({ ...f, overrideRating: e.target.value }))}
                    className={INPUT}
                    placeholder={`Default: ${CATEGORIES.find(c => c.value === addForm.selfRatedCategory)?.rating.toFixed(1) ?? "—"}`}
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Must be between 1.0 and 8.0. This sets where the player starts in the rating system.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddPlayer(false)} className={BTN_GHOST}>
                  Cancel
                </button>
                <button type="submit" disabled={addLoading} className={`flex-1 ${BTN_PRIMARY}`}>
                  {addLoading ? "Creating…" : "Create Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reassign Player Modal ── */}
      {showReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-teal-400 mb-1">Reassign Player</h2>
            <p className="text-xs text-slate-500 mb-5">
              Moves a player profile (and all match history) to a real user account.
              If the old account is a placeholder (@example.com), it will be deleted.
            </p>

            {reassignError && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">{reassignError}</div>
            )}

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Player to reassign *</label>
                <select
                  value={reassignPlayerId}
                  onChange={(e) => setReassignPlayerId(e.target.value)}
                  className={INPUT}
                  required
                >
                  <option value="">— select player —</option>
                  {playersWithUsers.map((u) => (
                    <option key={u.player!.id} value={u.player!.id}>
                      {u.name} ({u.email}) · {u.player!.currentRating.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayerUser && (
                <div className="px-3 py-2 bg-slate-800 rounded-lg text-xs text-slate-400">
                  Current account: <span className="text-slate-200">{selectedPlayerUser.email}</span>
                  {selectedPlayerUser.email?.endsWith("@example.com") && (
                    <span className="ml-2 text-amber-400">· placeholder (will be deleted)</span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assign to user *</label>
                <select
                  value={reassignTargetUserId}
                  onChange={(e) => setReassignTargetUserId(e.target.value)}
                  className={INPUT}
                  required
                >
                  <option value="">— select user without a player —</option>
                  {usersWithoutPlayer.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email} ({u.email})
                    </option>
                  ))}
                </select>
                {usersWithoutPlayer.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    No users without a player profile. The real user must register first.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReassign(false)} className={BTN_GHOST}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassignLoading || !reassignPlayerId || !reassignTargetUserId}
                  className={`flex-1 ${BTN_PRIMARY}`}
                >
                  {reassignLoading ? "Reassigning…" : "Reassign Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
