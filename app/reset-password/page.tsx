"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Forgot your password?</h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Password resets are handled by an administrator. Contact your HandiPick admin and
          ask them to generate a reset link for your account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-teal-400 hover:text-teal-300 text-sm transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-teal-900/50 border border-teal-600 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-teal-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Password updated</h1>
        <p className="text-slate-400 text-sm mb-6">You can now sign in with your new password.</p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Set new password</h1>
      <p className="text-slate-400 text-sm mb-6">Choose a new password for your account.</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Minimum 8 characters"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Repeat new password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
          ← Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <span className="text-4xl">🏓</span>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
