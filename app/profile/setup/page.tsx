"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selfRatedCategory, setSelfRatedCategory] = useState<"BEGINNER" | "NOVICE" | "NOVICE_PLUS" | "INTERMEDIATE" | "ADVANCED" | "ADVANCED_PLUS" | "EXPERT" | "EXPERT_PLUS" | "PRO" | "">("");
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

    const dob = new Date(dateOfBirth);
    if (!dateOfBirth || isNaN(dob.getTime()) || dob >= new Date()) {
      setError("A valid date of birth is required.");
      return;
    }

    if (!selfRatedCategory) {
      setError("Please select your skill level.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim(), dateOfBirth, gender, city: city.trim(), state: state.trim(), selfRatedCategory }),
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

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-300 mb-1">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min="1924-01-01"
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            {dateOfBirth && (
              <p className="mt-1 text-xs text-slate-500">
                Pickleball age for {new Date().getFullYear()}: <span className="text-teal-400 font-medium">{new Date().getFullYear() - new Date(dateOfBirth).getFullYear()}</span>
              </p>
            )}
          </div>

          {/* City & State */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="city"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                placeholder="e.g. Austin"
              />
            </div>
            <div className="w-24">
              <label
                htmlFor="state"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                State
              </label>
              <input
                id="state"
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                placeholder="TX"
              />
            </div>
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

          {/* Skill Level */}
          <div>
            <span className="block text-sm font-medium text-slate-300 mb-1">
              Skill Level
            </span>
            <p className="text-xs text-slate-500 mb-3">
              Select your current level honestly — the system will adjust after 30 games.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "BEGINNER",      label: "Beginner",      desc: "Brand new to pickleball",    rating: "2.0" },
                  { value: "NOVICE",        label: "Novice",        desc: "Learning the basics",        rating: "2.5" },
                  { value: "NOVICE_PLUS",   label: "Novice Plus",   desc: "Getting consistent",         rating: "3.0" },
                  { value: "INTERMEDIATE",  label: "Intermediate",  desc: "Developing your game",       rating: "3.5" },
                  { value: "ADVANCED",      label: "Advanced",      desc: "Competitive club player",    rating: "4.0" },
                  { value: "ADVANCED_PLUS", label: "Advanced Plus", desc: "Strong competitive player",  rating: "4.5" },
                  { value: "EXPERT",        label: "Expert",        desc: "High-level tournament play", rating: "5.0" },
                  { value: "EXPERT_PLUS",   label: "Expert Plus",   desc: "Near-elite level",           rating: "5.5" },
                  { value: "PRO",           label: "Pro",           desc: "Tournament / elite level",   rating: "6.0" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelfRatedCategory(cat.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selfRatedCategory === cat.value
                      ? "border-teal-500 bg-teal-900/30 text-slate-100"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold text-sm">{cat.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{cat.desc}</div>
                  <div className="text-xs mt-1 text-teal-400 font-medium">Starting rating: {cat.rating}</div>
                </button>
              ))}
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
