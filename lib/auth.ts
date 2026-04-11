import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      onboardingComplete: boolean;
      playerId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    onboardingComplete: boolean;
    playerId: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      // On sign-in or session update, refresh player status from DB
      if (user || trigger === "update") {
        const player = await prisma.player.findUnique({
          where: { userId: token.sub! },
          select: { id: true, onboardingComplete: true },
        });
        token.onboardingComplete = player?.onboardingComplete ?? false;
        token.playerId = player?.id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
      session.user.playerId = (token.playerId as string | null) ?? null;
      return session;
    },
  },
});
