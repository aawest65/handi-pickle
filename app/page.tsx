import Link from "next/link";
import PickleballIcon from "@/app/components/PickleballIcon";

const features = [
  {
    href: "/players",
    title: "Players",
    description: "Browse all registered players and their profiles.",
    icon: "👤",
  },
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description: "See top-ranked players by play type and format.",
    icon: "🏆",
  },
  {
    href: "/tournaments",
    title: "Tournaments",
    description: "View and create pickleball tournaments.",
    icon: "🥇",
  },
  {
    href: "/clubs",
    title: "Clubs",
    description: "Browse and manage clubs, members, and club ratings.",
    icon: "🏟️",
  },
  {
    href: "/matches",
    title: "Record a Match",
    description: "Submit match results and update player ratings instantly.",
    icon: "🎯",
  },
];

const stats = [
  { label: "Rating Scale", value: "1.0 – 8.0" },
  { label: "Play Types", value: "3" },
  { label: "Formats", value: "3" },
  { label: "Auto-updated", value: "✓" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-blue-500 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <PickleballIcon size={96} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            HandiPick
          </h1>
          <p className="text-xl text-teal-300 font-medium mb-4">
            Your pickleball handicap system
          </p>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            Track player skill levels across tournaments, clubs, and recreational play.
            Ratings update automatically after every match.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/players/me"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              My Stats
            </Link>
            <Link
              href="/matches"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors border border-slate-600"
            >
              Record a Match
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-800 border-y border-slate-700">
        <div className="max-w-5xl mx-auto py-6 px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-teal-400">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-slate-200 mb-8 text-center">
          Everything you need to manage your pickleball community
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-600 rounded-xl p-6 transition-all shadow-sm hover:shadow-teal-900/30 hover:shadow-lg"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-teal-300 transition-colors mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 border-t border-slate-800 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-200 mb-8 text-center">How ratings work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-teal-900 border border-teal-600 flex items-center justify-center text-teal-300 font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">Start</h3>
              <p className="text-slate-400 text-sm">
                Players begin with a rating based on their self-assessed skill level, refined by an administrator.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-teal-900 border border-teal-600 flex items-center justify-center text-teal-300 font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">Play Matches</h3>
              <p className="text-slate-400 text-sm">
                Record results for singles, doubles, or mixed — in rec, club, or tournament play.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-teal-900 border border-teal-600 flex items-center justify-center text-teal-300 font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">Ratings Update</h3>
              <p className="text-slate-400 text-sm">
                Ratings adjust automatically when scores are approved. The more you play, the more accurate your rating becomes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
