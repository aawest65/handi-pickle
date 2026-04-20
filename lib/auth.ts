import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      onboardingComplete:   boolean;
      playerId:             string | null;
      role:                 string;
      isClubAdmin:          boolean;
      isTournamentDirector: boolean;
    } & DefaultSession["user"];
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in or session update, refresh player/role from DB
      if ((user || trigger === "update") && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            isClubAdmin: true,
            isTournamentDirector: true,
            player: { select: { id: true, onboardingComplete: true } },
          },
        });
        token.role                 = dbUser?.role                 ?? "USER";
        token.isClubAdmin          = dbUser?.isClubAdmin          ?? false;
        token.isTournamentDirector = dbUser?.isTournamentDirector ?? false;
        token.onboardingComplete   = dbUser?.player?.onboardingComplete ?? false;
        token.playerId             = dbUser?.player?.id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role                 = (token.role as string)           ?? "USER";
      session.user.isClubAdmin          = (token.isClubAdmin as boolean)   ?? false;
      session.user.isTournamentDirector = (token.isTournamentDirector as boolean) ?? false;
      session.user.onboardingComplete   = (token.onboardingComplete as boolean)   ?? false;
      session.user.playerId             = (token.playerId as string | null) ?? null;
      return session;
    },
  },
});
