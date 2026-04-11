import { NextRequest, NextResponse } from "next/server";
import { jwtDecrypt } from "jose";

// Routes that require a fully onboarded player
const PROTECTED_ROUTES = ["/matches", "/profile"];

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = ["/login", "/register"];

// Routes that require ADMIN or SUPER_ADMIN role
const ADMIN_ROUTES = ["/admin"];

const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

/**
 * Decode an Auth.js v5 session JWT using only Web Crypto + jose webapi.
 *
 * Auth.js encodes with: HKDF-SHA256(secret, salt) → 64-byte CEK → dir+A256CBC-HS512 JWE
 * jose's main export always resolves to the webapi (Web Crypto) build.
 * HKDF derivation is done with crypto.subtle directly to avoid @panva/hkdf's
 * node:crypto import which fails silently in Edge Runtime.
 */
async function decodeSession(
  jweToken: string,
  secret: string,
  salt: string
): Promise<Record<string, unknown> | null> {
  try {
    const enc = new TextEncoder();

    // Derive 64-byte CEK using HKDF with pure Web Crypto (no node:crypto)
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      "HKDF",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: enc.encode(salt),
        info: enc.encode(`Auth.js Generated Encryption Key (${salt})`),
      },
      keyMaterial,
      512 // 64 bytes for A256CBC-HS512
    );

    // jose webapi's jwtDecrypt accepts Uint8Array as the CEK directly
    const cek = new Uint8Array(derivedBits);
    const { payload } = await jwtDecrypt(jweToken, cek);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

  let token: Record<string, unknown> | null = null;
  if (sessionCookie) {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
    token = await decodeSession(sessionCookie, secret, COOKIE_NAME);
  }

  const isLoggedIn = !!token;
  const onboardingComplete = (token?.onboardingComplete as boolean) ?? false;
  const role = (token?.role as string) ?? "USER";
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
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.nextUrl)
      );
    }
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons).*)"],
};
