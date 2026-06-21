import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Role } from "@/types/db";
import { getPrisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

const prismaClient = getPrisma();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  ...(prismaClient ? { adapter: PrismaAdapter(prismaClient) } : {}),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const client = getPrisma();
        if (!client) return null;

        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        const user = await client.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      const client = getPrisma();
      if (!client || !user.id) return;
      await client.user.updateMany({
        where: { id: user.id, role: { not: Role.ADMIN } },
        data: { role: Role.CUSTOMER },
      });
    },
  },
});
