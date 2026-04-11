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

export default function AdminPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => { setError("Failed to load users."); setLoading(false); });
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Manage users and roles · You are a{" "}
          <span className="text-yellow-400 font-medium">{ROLE_LABELS[session?.user?.role ?? "USER"]}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Users", value: users.length },
          { label: "Admins", value: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length },
          { label: "Active Players", value: users.filter((u) => u.player?.onboardingComplete).length },
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
                <tr
                  key={user.id}
                  className={`border-b border-slate-800 ${idx % 2 === 0 ? "bg-slate-900/60" : "bg-slate-800/20"}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200 truncate max-w-[180px]">
                      {user.name ?? "—"}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[180px]">{user.email}</div>
                    {!user.player?.onboardingComplete && (
                      <span className="text-xs text-amber-500">Incomplete onboarding</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {user.player ? (
                      <span className="font-semibold text-teal-400">
                        {user.player.currentRating.toFixed(2)}
                      </span>
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
    </div>
  );
}
