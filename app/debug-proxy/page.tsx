/**
 * Temporary debug page — goes through the proxy matcher.
 * Visit /debug-proxy while signed in to see what the proxy sees.
 * DELETE after debugging.
 */
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export default async function DebugProxyPage() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

  let token: Record<string, unknown> | null = null;
  let decodeError = "";
  if (sessionCookie) {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    try {
      token = await decode({
        token: sessionCookie,
        secret: secret!,
        salt: COOKIE_NAME,
      });
    } catch (e) {
      decodeError = String(e);
    }
  }

  return (
    <pre style={{ padding: 20, fontSize: 12 }}>
      {JSON.stringify(
        {
          COOKIE_NAME,
          allCookieNames: all.map((c) => c.name),
          hasCookie: !!sessionCookie,
          cookieLength: sessionCookie?.length ?? 0,
          decodedToken: token,
          decodeError,
          envAuthSecret: !!process.env.AUTH_SECRET,
          envNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        },
        null,
        2
      )}
    </pre>
  );
}
