import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "@/app/components/Providers";
import NavAuth from "@/app/components/NavAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pickleball Ratings",
  description: "Dynamic pickleball rating system",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/leagues", label: "Leagues" },
  { href: "/matches", label: "Record Match" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <Providers>
          <nav className="bg-navy-900 border-b border-teal-700/40 bg-slate-900 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏓</span>
                  <Link
                    href="/"
                    className="text-teal-400 font-bold text-lg tracking-tight hover:text-teal-300 transition-colors"
                  >
                    PickleRatings
                  </Link>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-teal-400 hover:bg-slate-800 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {/* Mobile nav - simplified */}
                <div className="md:hidden flex items-center gap-1">
                  {navLinks.slice(0, 4).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-teal-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <NavAuth />
              </div>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
          <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
            <p>PickleRatings &mdash; Dynamic pickleball rating system</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
