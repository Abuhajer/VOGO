import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** True when a database URL is configured (SQLite file or PostgreSQL). */
export function isDatabaseConfigured(): boolean {
  const url = process.env.NETLIFY_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  return Boolean(url);
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Returns null when DATABASE_URL is not set — avoids Prisma init on static-only deploys. */
export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/** Lazy Prisma client — throws only when accessed without a configured database. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    if (!client) {
      throw new Error("[db] Database is not configured (DATABASE_URL missing).");
    }

    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
