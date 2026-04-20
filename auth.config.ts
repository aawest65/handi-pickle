/**
 * Edge-safe auth config — no Prisma, no Node.js-only modules.
 * Used by middleware.ts (runs in Edge Runtime).
 * Full auth config (with PrismaAdapter) lives in lib/auth.ts.
 */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      onboardingComplete:   boolean;
      playerId:             string | null;
      role:                 string;
      isClubAdmin:          boolean;
      isTournamentDirector: boolean;
    } & import("next-auth").DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    onboardingComplete:   boolean;
    playerId:             string | null;
    role:                 string;
    isClubAdmin:          boolean;
    isTournamentDirector: boolean;
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Credentials must be listed so NextAuth knows about the provider,
    // but authorize runs server-side only (not in middleware)
    Credentials({ credentials: {} }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as string) ?? "USER";
      session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
      session.user.playerId = (token.playerId as string | null) ?? null;
      return session;
    },
  },
};
