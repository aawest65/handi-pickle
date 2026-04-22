import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "@/app/components/Providers";
import NavAuth from "@/app/components/NavAuth";
import BottomNav from "@/app/components/BottomNav";
import GuestBanner from "@/app/components/GuestBanner";
import InstallPrompt from "@/app/components/InstallPrompt";
import ServiceWorker from "@/app/components/ServiceWorker";
import PickleballIcon from "@/app/components/PickleballIcon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2dd4bf",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "HandiPick",
  description: "Your pickleball handicap system",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HandiPick",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/clubs", label: "Clubs" },
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
          <nav className="bg-slate-900 border-b border-teal-700/40 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                  <PickleballIcon size={32} />
                  <Link
                    href="/"
                    className="text-teal-400 font-bold text-lg tracking-tight hover:text-teal-300 transition-colors"
                  >
                    HandiPick
                  </Link>
                </div>
                {/* Desktop nav links */}
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
                <NavAuth />
              </div>
            </div>
          </nav>
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <footer className="hidden md:block bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
            <p>HandiPick &mdash; Your pickleball handicap system</p>
          </footer>
          <BottomNav />
          <GuestBanner />
          <InstallPrompt />
          <ServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
