"use client";

import { useState } from "react";
import Link from "next/link";
import { CERT_OPTIONS, SPECIALTY_OPTIONS } from "../constants";

interface CoachProfileData {
  id: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  yearsCoaching: number | null;
  certifications: string[];
  otherCerts: string | null;
  specialties: string[];
  lessonRateMin: number | null;
  lessonRateMax: number | null;
  groupRate: string | null;
  website: string | null;
  phone: string | null;
  showPhone: boolean;
  isPublic: boolean;
}

interface Props {
  initialProfile: CoachProfileData | null;
  coachProfileId: string | null;
}

const INPUT = "w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const SECTION = "bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4";

export function ProfileEditor({ initialProfile, coachProfileId }: Props) {
  const p = initialProfile;
  const [bio,          setBio]          = useState(p?.bio          ?? "");
  const [city,         setCity]         = useState(p?.city         ?? "");
  const [state,        setState]        = useState(p?.state        ?? "");
  const [years,        setYears]        = useState(p?.yearsCoaching?.toString() ?? "");
  const [certs,        setCerts]        = useState<string[]>(p?.certifications ?? []);
  const [otherCerts,   setOtherCerts]   = useState(p?.otherCerts   ?? "");
  const [specialties,  setSpecialties]  = useState<string[]>(p?.specialties   ?? []);
  const [rateMin,      setRateMin]      = useState(p?.lessonRateMin?.toString() ?? "");
  const [rateMax,      setRateMax]      = useState(p?.lessonRateMax?.toString() ?? "");
  const [groupRate,    setGroupRate]    = useState(p?.groupRate     ?? "");
  const [website,      setWebsite]      = useState(p?.website       ?? "");
  const [phone,        setPhone]        = useState(p?.phone         ?? "");
  const [showPhone,    setShowPhone]    = useState(p?.showPhone     ?? false);
  const [isPublic,     setIsPublic]     = useState(p?.isPublic      ?? true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  function toggleSet<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/coaches/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio:           bio.trim() || null,
          city:          city.trim() || null,
          state:         state.trim() || null,
          yearsCoaching: years ? parseInt(years) : null,
          certifications: certs,
          otherCerts:    otherCerts.trim() || null,
          specialties,
          lessonRateMin: rateMin ? parseInt(rateMin) : null,
          lessonRateMax: rateMax ? parseInt(rateMax) : null,
          groupRate:     groupRate.trim() || null,
          website:       website.trim() || null,
          phone:         phone.trim() || null,
          showPhone,
          isPublic,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">

      {/* Visibility */}
      <div className={SECTION}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Visibility</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsPublic(!isPublic)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${isPublic ? "bg-teal-600" : "bg-slate-600"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="text-sm text-slate-300">
            {isPublic ? "Listed in the coaches directory" : "Hidden from the directory"}
          </span>
        </label>
      </div>

      {/* About */}
      <div className={SECTION}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">About</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={INPUT} placeholder="e.g. Austin" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} className={INPUT} placeholder="e.g. TX" maxLength={2} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Years coaching</label>
          <input type="number" min="0" max="60" value={years} onChange={(e) => setYears(e.target.value)} className={INPUT} placeholder="e.g. 5" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell players about your coaching philosophy, background, and playing experience…"
            className={`${INPUT} resize-none`}
          />
        </div>
      </div>

      {/* Specialties */}
      <div className={SECTION}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Specialties</h2>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((s) => {
            const active = specialties.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSpecialties(toggleSet(specialties, s.value))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-teal-700/50 border-teal-500 text-teal-200"
                    : "bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {active ? "✓ " : ""}{s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Certifications */}
      <div className={SECTION}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Certifications & Licenses</h2>
        <div className="flex flex-wrap gap-2">
          {CERT_OPTIONS.map((c) => {
            const active = certs.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCerts(toggleSet(certs, c.value))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-amber-800/50 border-amber-500 text-amber-200"
                    : "bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {active ? "✓ " : ""}{c.label}
              </button>
            );
          })}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Other certifications / licenses</label>
          <input value={otherCerts} onChange={(e) => setOtherCerts(e.target.value)} className={INPUT} placeholder="e.g. USPTA, Tennis-to-Pickleball cert…" />
        </div>
      </div>

      {/* Pricing */}
      <div className={SECTION}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Pricing</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Private lesson — min ($/hr)</label>
            <input type="number" min="0" value={rateMin} onChange={(e) => setRateMin(e.target.value)} className={INPUT} placeholder="e.g. 60" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Private lesson — max ($/hr)</label>
            <input type="number" min="0" value={rateMax} onChange={(e) => setRateMax(e.target.value)} className={INPUT} placeholder="e.g. 90" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Group / clinic pricing <span className="text-slate-600">(free text)</span></label>
          <input value={groupRate} onChange={(e) => setGroupRate(e.target.value)} className={INPUT} placeholder="e.g. $25/person for groups of 4–6" />
        </div>
      </div>

      {/* Contact */}
      <div className={SECTION}>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Contact</h2>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={INPUT} placeholder="https://yoursite.com" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Phone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="e.g. (512) 555-0100" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setShowPhone(!showPhone)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${showPhone ? "bg-teal-600" : "bg-slate-600"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showPhone ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="text-sm text-slate-300">Show phone number on public profile</span>
        </label>
      </div>

      {/* Save */}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && (
        <p className="text-sm text-teal-400">
          Profile saved!{" "}
          {coachProfileId && (
            <Link href={`/coaches/${coachProfileId}`} className="underline hover:text-teal-300">
              View public profile →
            </Link>
          )}
        </p>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </div>
  );
}
