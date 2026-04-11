import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in or session update, refresh player status from DB
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: {
            role: true,
            player: { select: { id: true, onboardingComplete: true } },
          },
        });
        token.role = dbUser?.role ?? "USER";
        token.onboardingComplete = dbUser?.player?.onboardingComplete ?? false;
        token.playerId = dbUser?.player?.id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
      session.user.playerId = (token.playerId as string | null) ?? null;
      session.user.role = (token.role as string) ?? "USER";
      return session;
    },
  },
});
