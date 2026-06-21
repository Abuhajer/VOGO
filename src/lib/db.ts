import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

/** True when a database URL is configured (SQLite file or PostgreSQL). */
export function isDatabaseConfigured(): boolean {
  const url = process.env.NETLIFY_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  return Boolean(url);
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
