import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (Next.js 16 middleware).
 *
 * Per Next.js 16 docs, Proxy is for optimistic checks only — not full
 * session management. We check cookie *presence* to avoid a login redirect
 * for clearly-authenticated users; real auth is enforced by the API routes
 * and by useSession() checks in the page components themselves.
 */

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = ["/login", "/register"];

// Routes that require ADMIN or SUPER_ADMIN role (checked by presence of admin cookie, full check in page)
const ADMIN_ROUTES = ["/admin"];

const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export default function proxy(req: NextRequest) {
  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  const path = req.nextUrl.pathname;

  // Logged-in users visiting auth pages → go home
  if (hasSession && AUTH_ONLY_ROUTES.includes(path)) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Admin routes — require session (full role check happens in the admin page)
  if (ADMIN_ROUTES.some((r) => path.startsWith(r)) && !hasSession) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons).*)"],
};
