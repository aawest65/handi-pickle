export const CERT_OPTIONS = [
  { value: "PPR",       label: "PPR (Professional Pickleball Registry)" },
  { value: "IPTPA_L1",  label: "IPTPA Level 1" },
  { value: "IPTPA_L2",  label: "IPTPA Level 2" },
  { value: "IPTPA_L3",  label: "IPTPA Level 3" },
  { value: "USAPA",     label: "USAPA Ambassador" },
  { value: "PPA",       label: "PPA Certified" },
  { value: "APP",       label: "APP Certified" },
] as const;

export const SPECIALTY_OPTIONS = [
  { value: "BEGINNER",  label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",  label: "Advanced" },
  { value: "SINGLES",   label: "Singles" },
  { value: "DOUBLES",   label: "Doubles" },
  { value: "MIXED",     label: "Mixed Doubles" },
  { value: "MENTAL",    label: "Mental Game" },
  { value: "SERVE",     label: "Serve & Return" },
  { value: "STRATEGY",  label: "Strategy & Tactics" },
  { value: "YOUTH",     label: "Youth" },
] as const;

export const SPECIALTY_COLORS: Record<string, string> = {
  BEGINNER:     "bg-green-900/40 text-green-300 border-green-700/40",
  INTERMEDIATE: "bg-teal-900/40 text-teal-300 border-teal-700/40",
  ADVANCED:     "bg-blue-900/40 text-blue-300 border-blue-700/40",
  SINGLES:      "bg-purple-900/40 text-purple-300 border-purple-700/40",
  DOUBLES:      "bg-indigo-900/40 text-indigo-300 border-indigo-700/40",
  MIXED:        "bg-violet-900/40 text-violet-300 border-violet-700/40",
  MENTAL:       "bg-pink-900/40 text-pink-300 border-pink-700/40",
  SERVE:        "bg-amber-900/40 text-amber-300 border-amber-700/40",
  STRATEGY:     "bg-cyan-900/40 text-cyan-300 border-cyan-700/40",
  YOUTH:        "bg-orange-900/40 text-orange-300 border-orange-700/40",
};
