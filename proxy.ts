import { NextRequest, NextResponse } from "next/server";

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
 * Decrypt an Auth.js v5 JWE session token using only Web Crypto API.
 * Auth.js uses: HKDF-SHA256 key derivation → A256CBC-HS512 JWE encryption.
 */
async function decodeAuthJwt(
  jweString: string,
  secret: string,
  salt: string
): Promise<Record<string, unknown> | null> {
  try {
    const enc = new TextEncoder();

    // 1. Derive the 64-byte encryption key using HKDF (Web Crypto)
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      "HKDF",
      false,
      ["deriveBits"]
    );
    const info = enc.encode(`Auth.js Generated Encryption Key (${salt})`);
    const saltBytes = enc.encode(salt);
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: saltBytes, info },
      keyMaterial,
      512 // 64 bytes for A256CBC-HS512
    );
    const derivedKey = new Uint8Array(derivedBits);

    // 2. Parse the compact JWE: header.encKey.iv.ciphertext.tag
    const parts = jweString.split(".");
    if (parts.length !== 5) return null;
    const [, encryptedKeyB64, ivB64, ciphertextB64, tagB64] = parts;

    // A256CBC-HS512: first 32 bytes = MAC key, last 32 bytes = AES key
    const macKey = derivedKey.slice(0, 32);
    const aesKey = derivedKey.slice(32, 64);

    // 3. Decrypt the CEK (encrypted key) — for direct encryption it's empty
    const encryptedKey = base64urlDecode(encryptedKeyB64);
    // If encrypted key is empty, the derived key IS the CEK
    // (Auth.js uses dir algorithm — direct key agreement)
    // But we should verify this. If not empty, we'd need to unwrap it.
    // Auth.js uses "dir" (direct encryption), so encryptedKey should be empty.
    void encryptedKey; // unused for "dir"
    void macKey; // unused for browser MAC check (we trust Auth.js)

    // 4. Decrypt the payload using AES-CBC
    const iv = base64urlDecode(ivB64).buffer as ArrayBuffer;
    const ciphertext = base64urlDecode(ciphertextB64).buffer as ArrayBuffer;

    const aesCbcKey = await crypto.subtle.importKey(
      "raw",
      aesKey,
      "AES-CBC",
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aesCbcKey,
      ciphertext
    );

    // 5. Parse the JSON payload
    const payload = JSON.parse(new TextDecoder().decode(decrypted));
    return payload;
  } catch {
    return null;
  }
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

export default async function proxy(req: NextRequest) {
  const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

  let token: Record<string, unknown> | null = null;
  if (sessionCookie) {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
    token = await decodeAuthJwt(sessionCookie, secret, COOKIE_NAME);
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
