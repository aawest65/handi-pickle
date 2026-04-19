"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const INPUT    = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const TEXTAREA = `${INPUT} resize-none`;

export default function ClubRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName]               = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote]               = useState("");

  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [submitted, setSubmitted]     = useState(false);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be under 5 MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  }

  function removeLogo() {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("name", name);
      if (city)        fd.append("city",        city);
      if (state)       fd.append("state",       state);
      if (description) fd.append("description", description);
      if (note)        fd.append("note",        note);
      if (logoFile)    fd.append("logo",        logoFile);

      const res  = await fetch("/api/club-requests", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Failed to submit"); return; }
      setSubmitted(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 mb-4">You must be signed in to request a club.</p>
        <Link href="/login" className="text-teal-400 hover:underline text-sm">Sign in</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-900/40 border border-teal-600 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Request Submitted</h1>
        <p className="text-slate-400 text-sm mb-8">
          Your club request has been sent to our team for review. We&apos;ll get back to you soon.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-100 mt-3">Request a Club</h1>
        <p className="text-slate-400 text-sm mt-1">
          Submit your club for review. Once approved, you&apos;ll be set as the primary admin.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Club Logo */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Club Logo</label>
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-600 bg-slate-800 flex items-center justify-center shrink-0">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-xs rounded-lg border border-red-800/50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl hover:border-teal-500 hover:bg-teal-900/10 transition-colors text-slate-500 hover:text-teal-400"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Upload logo</span>
              <span className="text-xs mt-0.5">JPEG, PNG, WebP · Max 5 MB</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>

        {/* Club Name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Club Name <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riverside Picklers"
            className={INPUT}
            required
          />
        </div>

        {/* City / State */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={INPUT}
            >
              <option value="">— State —</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Description <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your club"
            rows={3}
            className={TEXTAREA}
          />
        </div>

        {/* Why this club */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Why are you starting this club? <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell us a bit about your pickleball community and what you're hoping to build…"
            rows={4}
            className={TEXTAREA}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {submitting ? "Submitting…" : "Submit Club Request"}
        </button>
      </form>
    </div>
  );
}
