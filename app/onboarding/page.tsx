"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const SKILL_LEVELS = [
  { value: "NOVICE",       label: "Novice",       desc: "Just starting out",        rating: "2.0" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "Developing your game",     rating: "3.5" },
  { value: "ADVANCED",     label: "Advanced",     desc: "Competitive club player",  rating: "4.5" },
  { value: "PRO",          label: "Pro",          desc: "Tournament / elite level", rating: "6.0" },
] as const;

const FORMAT_OPTIONS = [
  { value: "SINGLES", label: "Singles", icon: "👤" },
  { value: "DOUBLES", label: "Doubles", icon: "👥" },
  { value: "BOTH",    label: "Both",    icon: "🎯" },
];

const YEARS_OPTIONS = [
  { value: 0,  label: "< 1 year" },
  { value: 1,  label: "1–2 years" },
  { value: 3,  label: "3–5 years" },
  { value: 6,  label: "6+ years" },
];

type Step = 1 | 2 | 3 | "welcome";

function ProgressBar({ step }: { step: Step }) {
  const stepNum = step === "welcome" ? 4 : (step as number);
  return (
    <div className="w-full flex gap-1.5 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            s <= stepNum ? "bg-teal-500" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Identity
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [showAge, setShowAge] = useState(true);

  // Step 2 — Game
  const [skillLevel, setSkillLevel] = useState("");
  const [preferredFormat, setPreferredFormat] = useState("");
  const [yearsPlaying, setYearsPlaying] = useState<number | null>(null);

  // Step 3 — Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Welcome
  const [rating, setRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load existing player state to resume
  useEffect(() => {
    if (status !== "authenticated") return;

    // Already complete → go home
    if (session.user.onboardingComplete) {
      router.replace("/");
      return;
    }

    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.userName) setName(data.userName);
        if (data.player) {
          const p = data.player;
          if (p.name) setName(p.name);
          if (p.dateOfBirth) setDateOfBirth(new Date(p.dateOfBirth).toISOString().split("T")[0]);
          if (p.gender) setGender(p.gender);
          if (p.selfRatedCategory) setSkillLevel(p.selfRatedCategory);
          if (p.preferredFormat) setPreferredFormat(p.preferredFormat);
          if (p.yearsPlaying !== null && p.yearsPlaying !== undefined) setYearsPlaying(p.yearsPlaying);
          if (p.city) setCity(p.city);
          if (p.state) setState(p.state);
          if (typeof p.showAge === "boolean") setShowAge(p.showAge);

          // Resume at correct step
          if (!p.selfRatedCategory) setStep(p.name ? 2 : 1);
          else if (!p.onboardingComplete) setStep(3);
        }
      })
      .finally(() => setLoading(false));
  }, [status, session, router]);

  // Animate rating counter on welcome screen
  useEffect(() => {
    if (step !== "welcome" || rating === 0) return;
    setDisplayRating(0);
    const target = rating;
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayRating(target);
        clearInterval(interval);
      } else {
        setDisplayRating(Math.round(current * 1000) / 1000);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [step, rating]);

  async function saveStep(stepNum: number, data: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleStep1() {
    if (!name.trim()) { setError("Name is required."); return; }
    if (!dateOfBirth) { setError("Date of birth is required."); return; }
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime()) || dob >= new Date()) { setError("Please enter a valid date of birth."); return; }
    if (!gender) { setError("Please select your gender."); return; }
    const result = await saveStep(1, { name: name.trim(), dateOfBirth, gender, showAge });
    if (result) setStep(2);
  }

  async function handleStep2() {
    if (!skillLevel) { setError("Please select your skill level."); return; }
    const result = await saveStep(2, { selfRatedCategory: skillLevel, preferredFormat: preferredFormat || null, yearsPlaying });
    if (result) setStep(3);
  }

  async function handleStep3(skip = false) {
    const result = await saveStep(3, { city: skip ? "" : city, state: skip ? "" : state });
    if (result) {
      // Tell NextAuth to refresh the JWT so onboardingComplete is updated
      await update();
      const ratingMap: Record<string, number> = { NOVICE: 2.0, INTERMEDIATE: 3.5, ADVANCED: 4.5, PRO: 6.0 };
      setRating(ratingMap[skillLevel] ?? 3.0);
      setStep("welcome");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "welcome") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 relative">
          <div className="w-36 h-36 rounded-full bg-teal-900/40 border-2 border-teal-500 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(20,184,166,0.3)]">
            <div>
              <div className="text-4xl font-bold text-teal-400 tabular-nums">
                {displayRating.toFixed(3)}
              </div>
              <div className="text-xs text-teal-600 mt-1 uppercase tracking-widest">rating</div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-100 mb-3">You&apos;re in!</h1>
        <p className="text-slate-400 max-w-sm mb-2">
          Your starting rating is <span className="text-teal-400 font-semibold">{rating.toFixed(1)}</span> based on your skill level.
          It will adjust automatically as you record matches.
        </p>
        <p className="text-slate-500 text-sm mb-10">
          The more you play, the more accurate your rating becomes.
        </p>

        <button
          onClick={() => router.push("/matches")}
          className="w-full max-w-xs py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-lg transition-colors shadow-lg shadow-teal-900/40"
        >
          Record Your First Match
        </button>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Explore the app first
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 max-w-lg mx-auto">
      <ProgressBar step={step} />

      {/* ── STEP 1: Identity ── */}
      {step === 1 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-sm font-medium uppercase tracking-widest mb-2">Step 1 of 3</p>
            <h1 className="text-3xl font-bold text-slate-100">Who are you?</h1>
            <p className="text-slate-400 mt-2">This shows on your public profile.</p>
          </div>

          <div className="space-y-5 flex-1">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base"
                placeholder="Jane Smith"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1924-01-01"
                className="w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base"
              />
              {dateOfBirth && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Pickleball age for {new Date().getFullYear()}: <span className="text-teal-400 font-medium">{new Date().getFullYear() - new Date(dateOfBirth).getFullYear()}</span>
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {(["MALE", "FEMALE"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-3.5 rounded-xl border font-medium text-sm transition-all ${
                      gender === g
                        ? "border-teal-500 bg-teal-900/30 text-teal-300"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {g === "MALE" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age privacy */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={!showAge}
                onChange={(e) => setShowAge(!e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900 shrink-0"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Don&apos;t display my age on my public profile
              </span>
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button
            onClick={handleStep1}
            disabled={saving}
            className="mt-8 w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-2xl text-base transition-colors"
          >
            {saving ? "Saving…" : "Continue →"}
          </button>
        </div>
      )}

      {/* ── STEP 2: Your Game ── */}
      {step === 2 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-sm font-medium uppercase tracking-widest mb-2">Step 2 of 3</p>
            <h1 className="text-3xl font-bold text-slate-100">Your game</h1>
            <p className="text-slate-400 mt-2">Honest answers make your rating more accurate.</p>
          </div>

          <div className="space-y-6 flex-1">
            {/* Skill level */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Skill Level</label>
              <div className="grid grid-cols-2 gap-3">
                {SKILL_LEVELS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSkillLevel(cat.value)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      skillLevel === cat.value
                        ? "border-teal-500 bg-teal-900/30 text-slate-100"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <div className="font-semibold text-sm">{cat.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{cat.desc}</div>
                    <div className="text-xs mt-1.5 text-teal-400 font-medium">Starts at {cat.rating}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred format */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preferred Format <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setPreferredFormat(preferredFormat === f.value ? "" : f.value)}
                    className={`py-3 rounded-xl border text-sm transition-all ${
                      preferredFormat === f.value
                        ? "border-teal-500 bg-teal-900/30 text-teal-300"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-lg mb-0.5">{f.icon}</div>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Years playing */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                How long have you played? <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {YEARS_OPTIONS.map((y) => (
                  <button
                    key={y.value}
                    type="button"
                    onClick={() => setYearsPlaying(yearsPlaying === y.value ? null : y.value)}
                    className={`py-3 rounded-xl border text-sm transition-all ${
                      yearsPlaying === y.value
                        ? "border-teal-500 bg-teal-900/30 text-teal-300"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {y.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => { setError(""); setStep(1); }}
              className="px-5 py-4 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-2xl font-medium text-sm transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleStep2}
              disabled={saving}
              className="flex-1 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-2xl text-base transition-colors"
            >
              {saving ? "Saving…" : "Continue →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Location ── */}
      {step === 3 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-sm font-medium uppercase tracking-widest mb-2">Step 3 of 3</p>
            <h1 className="text-3xl font-bold text-slate-100">Where do you play?</h1>
            <p className="text-slate-400 mt-2">Shows on your profile. You can skip this.</p>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
              <input
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base"
                placeholder="e.g. Austin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base"
              >
                <option value="">— Select state —</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 space-y-3">
            <button
              onClick={() => handleStep3(false)}
              disabled={saving}
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-2xl text-base transition-colors"
            >
              {saving ? "Saving…" : "Finish Setup →"}
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => { setError(""); setStep(2); }}
                className="flex-1 py-3.5 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-2xl font-medium text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => handleStep3(true)}
                disabled={saving}
                className="flex-1 py-3.5 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-2xl font-medium text-sm transition-colors"
              >
                Skip location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
