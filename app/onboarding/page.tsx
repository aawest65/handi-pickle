"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  { value: 0, label: "< 1 year" },
  { value: 1, label: "1–2 years" },
  { value: 3, label: "3–5 years" },
  { value: 6, label: "6+ years" },
];

// UI steps: 1=Name+DOB  2=Gender+Privacy  3=SkillLevel  4=Format+Years  5=Location  welcome
type Step = 1 | 2 | 3 | 4 | 5 | "welcome";
const TOTAL_STEPS = 5;

interface DuplicatePlayer {
  id: string;
  name: string;
  playerNumber: string;
}

function ProgressBar({ step }: { step: Step }) {
  const n = step === "welcome" ? TOTAL_STEPS : (step as number);
  return (
    <div className="w-full flex gap-1.5 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < n ? "bg-teal-500" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

function OnboardingInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isEditMode   = searchParams.get("edit") === "1";
  const { data: session, status, update } = useSession();

  const [step, setStep]       = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  // Step 1 — Name + DOB
  const [name, setName]             = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Step 2 — Gender + Privacy
  const [gender, setGender]   = useState<"MALE" | "FEMALE" | "">("");
  const [showAge, setShowAge] = useState(true);

  // Step 3 — Skill level
  const [skillLevel, setSkillLevel] = useState("");

  // Step 4 — Format + Years
  const [preferredFormat, setPreferredFormat] = useState("");
  const [yearsPlaying, setYearsPlaying]       = useState<number | null>(null);

  // Step 5 — Location
  const [city, setCity]   = useState("");
  const [state, setState] = useState("");

  // Duplicate account warning
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicatePlayer[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Welcome animation
  const [rating, setRating]               = useState(0);
  const [displayRating, setDisplayRating] = useState(0);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session.user.onboardingComplete && !isEditMode) {
      router.replace("/");
      return;
    }
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.userName) setName(data.userName);
        if (data.player) {
          const p = data.player;
          if (p.name)        setName(p.name);
          if (p.dateOfBirth) setDateOfBirth(new Date(p.dateOfBirth).toISOString().split("T")[0]);
          if (p.gender)      setGender(p.gender);
          if (p.selfRatedCategory)  setSkillLevel(p.selfRatedCategory);
          if (p.preferredFormat)    setPreferredFormat(p.preferredFormat);
          if (p.yearsPlaying !== null && p.yearsPlaying !== undefined) setYearsPlaying(p.yearsPlaying);
          if (p.city)  setCity(p.city);
          if (p.state) setState(p.state);
          if (typeof p.showAge === "boolean") setShowAge(p.showAge);

          // Resume at correct step
          if (!p.gender)              setStep(p.name ? 2 : 1);
          else if (!p.selfRatedCategory) setStep(3);
          else if (!p.onboardingComplete) setStep(5);
        }
      })
      .finally(() => setLoading(false));
  }, [status, session, router, isEditMode]);

  useEffect(() => {
    setError("");
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [step]);

  // Animate rating on welcome
  useEffect(() => {
    if (step !== "welcome" || rating === 0) return;
    setDisplayRating(0);
    const target = rating;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setDisplayRating(target); clearInterval(interval); }
      else                   { setDisplayRating(Math.round(current * 1000) / 1000); }
    }, 1200 / steps);
    return () => clearInterval(interval);
  }, [step, rating]);

  async function saveStep(stepNum: number, data: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res  = await fetch("/api/onboarding", {
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

  // Step 1 → 2: validate name + DOB, check for duplicates, then advance
  async function handleStep1(ignoreDuplicate = false) {
    if (!name.trim())  { setError("Name is required."); return; }
    if (!dateOfBirth)  { setError("Date of birth is required."); return; }
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime()) || dob >= new Date()) { setError("Please enter a valid date of birth."); return; }

    if (!ignoreDuplicate && !isEditMode) {
      setCheckingDuplicate(true);
      try {
        const res  = await fetch(`/api/players/check?name=${encodeURIComponent(name.trim())}&dob=${dateOfBirth}`);
        const data = await res.json();
        if (data.duplicates?.length > 0) {
          setDuplicateWarning(data.duplicates);
          return;
        }
      } catch {
        // Non-blocking — if the check fails, proceed normally
      } finally {
        setCheckingDuplicate(false);
      }
    }

    setDuplicateWarning(null);
    setStep(2);
  }

  // Step 2 → 3: save name+DOB+gender+showAge to API step 1
  async function handleStep2() {
    if (!gender) { setError("Please select your gender."); return; }
    const result = await saveStep(1, { name: name.trim(), dateOfBirth, gender, showAge });
    if (result) setStep(3);
  }

  // Step 3 → 4: validate skill, save locally
  function handleStep3() {
    if (!skillLevel) { setError("Please select your skill level."); return; }
    setStep(4);
  }

  // Step 4 → 5: save skill+format+years to API step 2
  async function handleStep4() {
    const result = await saveStep(2, { selfRatedCategory: skillLevel, preferredFormat: preferredFormat || null, yearsPlaying });
    if (result) setStep(5);
  }

  // Step 5 → welcome: save location to API step 3
  async function handleStep5(skip = false) {
    const result = await saveStep(3, { city: skip ? "" : city, state: skip ? "" : state });
    if (result) {
      await update();
      if (isEditMode) {
        router.push("/profile");
      } else {
        const ratingMap: Record<string, number> = { NOVICE: 2.0, INTERMEDIATE: 3.5, ADVANCED: 4.5, PRO: 6.0 };
        setRating(ratingMap[skillLevel] ?? 3.0);
        setStep("welcome");
      }
    }
  }

  const INPUT = "w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base";
  const CONTINUE = "w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-2xl text-base transition-colors";
  const BACK = "text-slate-500 hover:text-slate-300 text-sm text-center transition-colors";

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
        <div className="mb-8">
          <div className="w-36 h-36 rounded-full bg-teal-900/40 border-2 border-teal-500 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(20,184,166,0.3)]">
            <div>
              <div className="text-4xl font-bold text-teal-400 tabular-nums">{displayRating.toFixed(3)}</div>
              <div className="text-xs text-teal-600 mt-1 uppercase tracking-widest">rating</div>
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-3">You&apos;re in!</h1>
        <p className="text-slate-400 max-w-sm mb-2">
          Your starting rating is <span className="text-teal-400 font-semibold">{rating.toFixed(1)}</span> based on your skill level.
          It adjusts automatically as you record matches.
        </p>
        <p className="text-slate-500 text-sm mb-10">The more you play, the more accurate your rating becomes.</p>
        <button
          onClick={() => router.push("/matches")}
          className="w-full max-w-xs py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-lg transition-colors shadow-lg shadow-teal-900/40"
        >
          Record Your First Match
        </button>
        <button onClick={() => router.push("/")} className="mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors">
          Explore the app first
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 max-w-lg mx-auto">
      <ProgressBar step={step} />

      {/* ── Step 1: Name + Date of Birth ── */}
      {step === 1 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-xs font-semibold uppercase tracking-widest mb-2">Step 1 of {TOTAL_STEPS}</p>
            <h1 className="text-3xl font-bold text-slate-100">Who are you?</h1>
            <p className="text-slate-400 mt-2 text-sm">This shows on your public profile.</p>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Display name</label>
              <input
                ref={firstInputRef}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                className={INPUT}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1924-01-01"
                className={INPUT}
              />
              {dateOfBirth && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Pickleball age for {new Date().getUTCFullYear()}:{" "}
                  <span className="text-teal-400 font-medium">{new Date().getUTCFullYear() - new Date(dateOfBirth).getUTCFullYear()}</span>
                </p>
              )}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button
            onClick={() => handleStep1()}
            disabled={checkingDuplicate}
            className={`mt-8 ${CONTINUE}`}
          >
            {checkingDuplicate ? "Checking…" : "Continue →"}
          </button>
        </div>
      )}

      {/* ── Duplicate account warning modal ── */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-800 border border-yellow-600/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-yellow-400 text-xl shrink-0">⚠</span>
              <div>
                <h3 className="text-base font-bold text-slate-100">Possible duplicate account</h3>
                <p className="text-sm text-slate-400 mt-1">
                  A player with this name and birthday already exists:
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl px-4 py-3 mb-5 space-y-1.5">
              {duplicateWarning.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-medium">{p.name}</span>
                  <span className="text-slate-500 text-xs">{p.playerNumber}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-5">
              If this is you, you may already have an account. If you&apos;re a different person, you can continue.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleStep1(true)}
                className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
              >
                Continue anyway
              </button>
              <button
                onClick={() => setDuplicateWarning(null)}
                className="w-full py-3.5 border border-slate-600 text-slate-400 hover:text-slate-200 rounded-xl text-sm transition-colors"
              >
                Let me check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Gender + Age Privacy ── */}
      {step === 2 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-xs font-semibold uppercase tracking-widest mb-2">Step 2 of {TOTAL_STEPS}</p>
            <h1 className="text-3xl font-bold text-slate-100">A bit more about you</h1>
            <p className="text-slate-400 mt-2 text-sm">Used for rating calculations.</p>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {(["MALE", "FEMALE"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-5 rounded-2xl border font-semibold text-base transition-all ${
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

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={!showAge}
                onChange={(e) => setShowAge(!e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900 shrink-0"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Don&apos;t show my age on my public profile
              </span>
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex flex-col gap-3">
            <button onClick={handleStep2} disabled={saving} className={CONTINUE}>
              {saving ? "Saving…" : "Continue →"}
            </button>
            <button onClick={() => setStep(1)} className={BACK}>← Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Skill Level ── */}
      {step === 3 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-xs font-semibold uppercase tracking-widest mb-2">Step 3 of {TOTAL_STEPS}</p>
            <h1 className="text-3xl font-bold text-slate-100">Your skill level</h1>
            <p className="text-slate-400 mt-2 text-sm">Honest answers make your rating more accurate.</p>
          </div>

          <div className="flex-1">
            {isEditMode ? (
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">Skill Level</p>
                  <p className="text-xs text-slate-500 mt-0.5">Can only be changed by an admin</p>
                </div>
                <span className="text-sm font-semibold text-teal-400">
                  {SKILL_LEVELS.find((s) => s.value === skillLevel)?.label ?? skillLevel}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {SKILL_LEVELS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSkillLevel(cat.value)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      skillLevel === cat.value
                        ? "border-teal-500 bg-teal-900/30 text-slate-100"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <div className="font-semibold text-sm">{cat.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{cat.desc}</div>
                    <div className="text-xs mt-2 text-teal-400 font-medium">Starts at {cat.rating}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex flex-col gap-3">
            <button onClick={handleStep3} className={CONTINUE}>Continue →</button>
            <button onClick={() => setStep(2)} className={BACK}>← Back</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Preferred Format + Years Playing ── */}
      {step === 4 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-xs font-semibold uppercase tracking-widest mb-2">Step 4 of {TOTAL_STEPS}</p>
            <h1 className="text-3xl font-bold text-slate-100">Your game</h1>
            <p className="text-slate-400 mt-2 text-sm">Both optional — skip if you&apos;re not sure.</p>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Preferred format</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setPreferredFormat(preferredFormat === f.value ? "" : f.value)}
                    className={`py-4 rounded-2xl border text-sm transition-all ${
                      preferredFormat === f.value
                        ? "border-teal-500 bg-teal-900/30 text-teal-300"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-xl mb-1">{f.icon}</div>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">How long have you played?</label>
              <div className="grid grid-cols-2 gap-2">
                {YEARS_OPTIONS.map((y) => (
                  <button
                    key={y.value}
                    type="button"
                    onClick={() => setYearsPlaying(yearsPlaying === y.value ? null : y.value)}
                    className={`py-4 rounded-2xl border text-sm transition-all ${
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

          <div className="mt-8 flex flex-col gap-3">
            <button onClick={handleStep4} disabled={saving} className={CONTINUE}>
              {saving ? "Saving…" : "Continue →"}
            </button>
            <button onClick={() => setStep(3)} className={BACK}>← Back</button>
          </div>
        </div>
      )}

      {/* ── Step 5: Location ── */}
      {step === 5 && (
        <div className="flex flex-col flex-1">
          <div className="mb-8">
            <p className="text-teal-500 text-xs font-semibold uppercase tracking-widest mb-2">Step 5 of {TOTAL_STEPS}</p>
            <h1 className="text-3xl font-bold text-slate-100">Where do you play?</h1>
            <p className="text-slate-400 mt-2 text-sm">Shows on your profile. You can skip this.</p>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
              <input
                ref={firstInputRef}
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={INPUT}
                placeholder="e.g. Austin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={INPUT}
              >
                <option value="">— Select state —</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex flex-col gap-3">
            <button onClick={() => handleStep5(false)} disabled={saving} className={CONTINUE}>
              {saving ? "Saving…" : isEditMode ? "Save Changes" : "Finish Setup →"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(4)}
                className="py-3.5 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-2xl text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => handleStep5(true)}
                disabled={saving}
                className="py-3.5 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-2xl text-sm transition-colors"
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

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}
