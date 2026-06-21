import type { PrismaClient as PrismaClientType } from "@prisma/client";

type PrismaClient = PrismaClientType;

type PrismaClientConstructor = new (options?: {
  log?: ("error" | "warn" | "info" | "query")[];
}) => PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaModuleFailed?: boolean;
};

/** Map Netlify DB URL into DATABASE_URL for Prisma (build scripts do this too). */
function ensureDatabaseUrlFromNetlify(): void {
  if (!process.env.DATABASE_URL?.trim() && process.env.NETLIFY_DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL.trim();
  }
}

/** True when a database URL is configured (SQLite file or PostgreSQL). */
export function isDatabaseConfigured(): boolean {
  ensureDatabaseUrlFromNetlify();
  const url = process.env.NETLIFY_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) return false;
  // PostgreSQL Prisma client rejects file: URLs — skip DB and use static catalog instead.
  if (url.startsWith("file:")) {
    return false;
  }
  // Netlify builds ship the PostgreSQL Prisma client — require a postgres URL.
  if (process.env.NETLIFY === "true") {
    return url.startsWith("postgres");
  }
  return url.startsWith("postgres");
}

function loadPrismaClientClass(): PrismaClientConstructor | null {
  if (globalForPrisma.prismaModuleFailed) return null;

  try {
    // Lazy require avoids crashing pages when the query engine binary is missing on the host.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@prisma/client") as { PrismaClient: PrismaClientConstructor };
    return mod.PrismaClient;
  } catch (err) {
    globalForPrisma.prismaModuleFailed = true;
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[db] Failed to load Prisma client module — using static catalog fallbacks (${message})`);
    return null;
  }
}

function createPrismaClient(): PrismaClient | null {
  const PrismaClient = loadPrismaClientClass();
  if (!PrismaClient) return null;

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[db] Prisma client init failed — using static catalog fallbacks (${message})`);
    return null;
  }
}

/** Returns null when DATABASE_URL is not set or Prisma cannot load — avoids hard crashes. */
export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient() ?? undefined;
  }

  return globalForPrisma.prisma ?? null;
}

/** Lazy Prisma client — throws only when accessed without a configured database. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    if (!client) {
      throw new Error("[db] Database is not configured or Prisma is unavailable.");
    }

    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
