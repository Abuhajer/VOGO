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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: Role }).role ?? Role.CUSTOMER;
        token.name = user.name;
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        const patch = session as { name?: string; image?: string | null };
        if (patch.name !== undefined) token.name = patch.name;
        if (patch.image !== undefined) token.picture = patch.image ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? Role.CUSTOMER;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
      }
      return session;
    },
  },
  pages: {},
} satisfies NextAuthConfig;
