// NextAuth (Credentials) with JWT sessions
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "email-password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(creds) {
        const email = (creds?.email || "").toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.status !== "ACTIVE") return null;
        const ok = await bcrypt.compare(creds?.password || "", user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name || "", email: user.email || "", role: user.role, accessLevel: user.accessLevel, phone: user.phone || null } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = (user as any).id; token.role = (user as any).role; token.accessLevel = (user as any).accessLevel; token.phone = (user as any).phone || null; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).id = token.id; (session.user as any).role = token.role; (session.user as any).accessLevel = token.accessLevel; (session.user as any).phone = token.phone || null; }
      return session;
    },
  },
};
