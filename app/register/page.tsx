"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

type Step = 1 | 2 | 3;

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {([1, 2, 3] as Step[]).map((s) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === step
              ? "w-6 h-2 bg-teal-500"
              : s < step
              ? "w-2 h-2 bg-teal-700"
              : "w-2 h-2 bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Name
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");

  // Step 2 — Email
  const [email, setEmail] = useState("");

  // Step 3 — Password
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3 — Consent
  const [termsAccepted, setTermsAccepted]       = useState(false);
  const [dataShareAccepted, setDataShareAccepted] = useState(false);
  const [emailConsent, setEmailConsent]         = useState(false);

  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFieldError("");
    firstInputRef.current?.focus();
  }, [step]);

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/onboarding" });
  }

  function handleStep1() {
    if (!firstName.trim()) { setFieldError("First name is required."); return; }
    if (!lastName.trim())  { setFieldError("Last name is required."); return; }
    setStep(2);
  }

  function handleStep2() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim())           { setFieldError("Email is required."); return; }
    if (!emailRegex.test(email)) { setFieldError("Enter a valid email address."); return; }
    setStep(3);
  }

  async function handleStep3(e: FormEvent) {
    e.preventDefault();
    if (!password)                     { setFieldError("Password is required."); return; }
    if (password.length < 8)           { setFieldError("Password must be at least 8 characters."); return; }
    if (!confirmPassword)              { setFieldError("Please confirm your password."); return; }
    if (password !== confirmPassword)  { setFieldError("Passwords do not match."); return; }
    if (!termsAccepted)                { setFieldError("You must accept the Terms of Service and Privacy Policy."); return; }
    if (!dataShareAccepted)            { setFieldError("You must agree to the data sharing terms to use HandiPick."); return; }

    setSubmitting(true);
    setServerError("");
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, termsAccepted, dataShareAccepted, emailConsent }),
      });
      const data = await res.json();
      if (res.status === 409) { setServerError("An account with that email already exists."); return; }
      if (!res.ok)            { setServerError(data.error ?? "Registration failed. Please try again."); return; }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setServerError("Account created! Please sign in."); return; }
      window.location.href = "/onboarding";
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const INPUT = "w-full rounded-xl bg-slate-800 border border-slate-600 px-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base";
  const CONTINUE = "w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-2xl text-base transition-colors";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col">

        {/* Logo / title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-teal-400">HandiPick</h1>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>

        <StepDots step={step} />

        {serverError && (
          <div className="mb-5 rounded-xl bg-red-900/40 border border-red-700 px-4 py-3 text-red-300 text-sm">
            {serverError}
          </div>
        )}

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1">What&apos;s your name?</h2>
              <p className="text-slate-400 text-sm">This appears on your player profile.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">First name</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  className={INPUT}
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Last name</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  className={INPUT}
                  placeholder="Smith"
                />
              </div>
            </div>

            {fieldError && <p className="text-sm text-red-400 -mt-2">{fieldError}</p>}

            <button onClick={handleStep1} className={CONTINUE}>Continue →</button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: Email ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1">What&apos;s your email?</h2>
              <p className="text-slate-400 text-sm">You&apos;ll use this to sign in.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                ref={firstInputRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStep2()}
                className={INPUT}
                placeholder="you@example.com"
              />
            </div>

            {fieldError && <p className="text-sm text-red-400">{fieldError}</p>}

            <button onClick={handleStep2} className={CONTINUE}>Continue →</button>

            <button
              onClick={() => { setFieldError(""); setStep(1); }}
              className="text-slate-500 hover:text-slate-300 text-sm text-center transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Password ── */}
        {step === 3 && (
          <form onSubmit={handleStep3} noValidate className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1">Create a password</h2>
              <p className="text-slate-400 text-sm">At least 8 characters.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  ref={firstInputRef}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={INPUT}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={INPUT}
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
                />
                <span className="text-sm text-slate-300">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-teal-400 hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" target="_blank" className="text-teal-400 hover:underline">Privacy Policy</a>
                  <span className="text-red-400 ml-1">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dataShareAccepted}
                  onChange={(e) => setDataShareAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
                />
                <span className="text-sm text-slate-300">
                  I agree that HandiPick may share my name, rating, and contact email with tournament directors and club organizers for match seeding and club management
                  <span className="text-red-400 ml-1">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailConsent}
                  onChange={(e) => setEmailConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
                />
                <span className="text-sm text-slate-300">
                  I&apos;d like to receive rating updates, match notifications, and HandiPick news by email{" "}
                  <span className="text-slate-500">(optional)</span>
                </span>
              </label>
            </div>

            {fieldError && <p className="text-sm text-red-400">{fieldError}</p>}

            <button type="submit" disabled={submitting} className={CONTINUE}>
              {submitting ? "Creating account…" : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => { setFieldError(""); setStep(2); }}
              className="text-slate-500 hover:text-slate-300 text-sm text-center transition-colors"
            >
              ← Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
