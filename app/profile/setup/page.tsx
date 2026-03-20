"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill display name from session if available
  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    const ageNum = Number(age);
    if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
      setError("Age must be a number between 5 and 100.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim(), age: Number(age), gender }),
      });

      if (res.status === 201 || res.status === 409) {
        // 201 = created, 409 = profile already exists — both go home
        router.push("/");
        return;
      }

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setError(data.error ?? "Failed to create profile. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Show nothing while session is loading or redirecting
  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-teal-400 mb-1 text-center">
          Set Up Your Player Profile
        </h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          This information will appear on your public profile and leaderboards
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="How you'll appear in the app"
            />
          </div>

          {/* Age */}
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Age
            </label>
            <input
              id="age"
              type="number"
              min={5}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="Your age"
            />
          </div>

          {/* Gender */}
          <div>
            <span className="block text-sm font-medium text-slate-300 mb-3">
              Gender
            </span>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="gender"
                  value="MALE"
                  checked={gender === "MALE"}
                  onChange={() => setGender("MALE")}
                  className="accent-teal-500 w-4 h-4"
                />
                <span className="text-slate-300 group-hover:text-teal-400 transition-colors text-sm">
                  Male
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="gender"
                  value="FEMALE"
                  checked={gender === "FEMALE"}
                  onChange={() => setGender("FEMALE")}
                  className="accent-teal-500 w-4 h-4"
                />
                <span className="text-slate-300 group-hover:text-teal-400 transition-colors text-sm">
                  Female
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold transition-colors"
          >
            {submitting ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
