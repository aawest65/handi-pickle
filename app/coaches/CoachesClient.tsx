"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { CERT_OPTIONS, SPECIALTY_OPTIONS, SPECIALTY_COLORS } from "./constants";

interface CoachCard {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  yearsCoaching: number | null;
  certifications: string[];
  otherCerts: string | null;
  specialties: string[];
  lessonRateMin: number | null;
  lessonRateMax: number | null;
  groupRate: string | null;
  reviewCount: number;
  avgRating: number | null;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const px = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${px} ${s <= Math.round(rating) ? "text-yellow-400" : "text-slate-600"}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export function CoachesClient({ coaches }: { coaches: CoachCard[] }) {
  const [locationQ, setLocationQ] = useState("");
  const [nameQ,     setNameQ]     = useState("");
  const [specialty, setSpecialty] = useState("");

  const filtered = useMemo(() => {
    return coaches.filter((c) => {
      if (nameQ.trim()) {
        if (!(c.name ?? "").toLowerCase().includes(nameQ.toLowerCase())) return false;
      }
      if (locationQ.trim()) {
        const loc = `${c.city ?? ""} ${c.state ?? ""}`.toLowerCase();
        if (!loc.includes(locationQ.toLowerCase())) return false;
      }
      if (specialty) {
        if (!c.specialties.includes(specialty)) return false;
      }
      return true;
    });
  }, [coaches, nameQ, locationQ, specialty]);

  const certLabel = (v: string) => CERT_OPTIONS.find((c) => c.value === v)?.label ?? v;
  const specLabel = (v: string) => SPECIALTY_OPTIONS.find((s) => s.value === v)?.label ?? v;

  function rateDisplay(c: CoachCard) {
    if (!c.lessonRateMin && !c.lessonRateMax) return null;
    if (c.lessonRateMin && c.lessonRateMax && c.lessonRateMin !== c.lessonRateMax)
      return `$${c.lessonRateMin}–$${c.lessonRateMax}/hr`;
    return `$${c.lessonRateMin ?? c.lessonRateMax}/hr`;
  }

  return (
    <>
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
            placeholder="Search by name…"
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <input
            value={locationQ}
            onChange={(e) => setLocationQ(e.target.value)}
            placeholder="City or state…"
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All specialties</option>
          {SPECIALTY_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🎾</div>
          <p className="text-lg font-medium text-slate-300">No coaches found</p>
          <p className="text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-4">{filtered.length} coach{filtered.length !== 1 ? "es" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((coach) => (
              <Link
                key={coach.id}
                href={`/coaches/${coach.id}`}
                className="group bg-slate-800 border border-slate-700 hover:border-teal-600 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-teal-900/20 flex flex-col gap-4"
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-900 border-2 border-indigo-600 overflow-hidden flex items-center justify-center text-xl font-bold text-indigo-300 shrink-0 relative">
                    {coach.avatarUrl ? (
                      <Image src={coach.avatarUrl} alt={coach.name ?? ""} fill className="object-cover" sizes="56px" />
                    ) : (
                      (coach.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-slate-100 group-hover:text-teal-300 transition-colors truncate">{coach.name ?? "—"}</h2>
                    {(coach.city || coach.state) && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        {[coach.city, coach.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {coach.yearsCoaching != null && (
                      <p className="text-xs text-slate-500 mt-0.5">{coach.yearsCoaching} yr{coach.yearsCoaching !== 1 ? "s" : ""} coaching</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {coach.avgRating != null ? (
                      <>
                        <div className="flex items-center gap-1 justify-end">
                          <StarRating rating={coach.avgRating} />
                          <span className="text-xs font-bold text-yellow-400">{coach.avgRating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-slate-500">{coach.reviewCount} review{coach.reviewCount !== 1 ? "s" : ""}</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-600">No reviews yet</p>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                {coach.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {coach.specialties.map((s) => (
                      <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SPECIALTY_COLORS[s] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                        {specLabel(s)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Certs + rate */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-700">
                  <div className="flex flex-wrap gap-1">
                    {coach.certifications.slice(0, 3).map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/40">
                        {c.replace("IPTPA_", "IPTPA ")}
                      </span>
                    ))}
                    {coach.certifications.length === 0 && coach.otherCerts && (
                      <span className="text-xs text-slate-500 italic truncate max-w-[160px]">{coach.otherCerts}</span>
                    )}
                  </div>
                  {rateDisplay(coach) && (
                    <span className="text-sm font-semibold text-teal-400">{rateDisplay(coach)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export { StarRating, type CoachCard };
