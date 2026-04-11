import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

// Routes that require a fully onboarded player
const PROTECTED_ROUTES = ["/matches", "/profile"];

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = ["/login", "/register"];

// Routes that require ADMIN or SUPER_ADMIN role
const ADMIN_ROUTES = ["/admin"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const onboardingComplete = session?.user?.onboardingComplete ?? false;
  const role = session?.user?.role ?? "USER";
  const path = req.nextUrl.pathname;

  // Logged-in users visiting auth pages → redirect based on onboarding status
  if (isLoggedIn && AUTH_ONLY_ROUTES.includes(path)) {
    const dest = onboardingComplete ? "/" : "/onboarding";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  // Unauthenticated users trying to access protected routes
  if (!isLoggedIn && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.nextUrl)
    );
  }

  // Logged-in but onboarding incomplete → gate protected routes
  if (isLoggedIn && !onboardingComplete && PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
  }

  // Admin routes — require ADMIN or SUPER_ADMIN
  if (ADMIN_ROUTES.some((r) => path.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.nextUrl));
    }
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons).*)"],
};
