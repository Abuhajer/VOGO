import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import { Role } from "@/types/db";

export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  debug: false,
  providers: [],
  logger: {
    error(error) {
      // Expected when email/password don't match — UI already shows a message.
      if (error instanceof CredentialsSignin) return;
      console.error(error);
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: Role }).role ?? Role.CUSTOMER;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? Role.CUSTOMER;
      }
      return session;
    },
  },
  pages: {},
} satisfies NextAuthConfig;
