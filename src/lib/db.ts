import path from "path";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

type PrismaClient = PrismaClientType;

type PrismaClientConstructor = new (options?: {
  log?: ("error" | "warn" | "info" | "query")[];
}) => PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaModuleFailed?: boolean;
};

/** Models that must exist on a healthy generated client (schema additions). */
const REQUIRED_PRISMA_DELEGATES = ["promotion", "customerNote", "customerFeedback"] as const;

/** Map Netlify DB URL into DATABASE_URL for Prisma (build scripts do this too). */
function ensureDatabaseUrlFromNetlify(): void {
  if (!process.env.DATABASE_URL?.trim() && process.env.NETLIFY_DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL.trim();
  }
}

/** True when a database URL is configured and matches the Prisma client. */
export function isDatabaseConfigured(): boolean {
  ensureDatabaseUrlFromNetlify();
  const url = process.env.NETLIFY_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) return false;

  // Netlify builds ship the PostgreSQL Prisma client — require a postgres URL.
  if (process.env.NETLIFY === "true") {
    return url.startsWith("postgres");
  }

  // Local dev uses schema.prisma (SQLite file: URLs).
  if (url.startsWith("file:")) {
    return true;
  }

  return url.startsWith("postgres");
}

function bustPrismaModuleCache(): void {
  for (const key of Object.keys(require.cache)) {
    if (
      key.includes(`${path.sep}.prisma${path.sep}`) ||
      key.includes(`${path.sep}@prisma${path.sep}client`)
    ) {
      delete require.cache[key];
    }
  }
  globalForPrisma.prismaModuleFailed = false;
}

function isPrismaClientHealthy(client: PrismaClient): boolean {
  const record = client as unknown as Record<string, { findMany?: unknown } | undefined>;
  return REQUIRED_PRISMA_DELEGATES.every(
    (delegate) => typeof record[delegate]?.findMany === "function"
  );
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
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    if (!isPrismaClientHealthy(client)) {
      void client.$disconnect().catch(() => undefined);
      console.warn(
        "[db] Generated Prisma client is missing expected models — run `npx prisma generate` and restart the dev server."
      );
      return null;
    }
    return client;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[db] Prisma client init failed — using static catalog fallbacks (${message})`);
    return null;
  }
}

function resetPrismaClient(): void {
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }
  if (process.env.NODE_ENV === "development") {
    bustPrismaModuleCache();
  }
}

/** Returns null when DATABASE_URL is not set or Prisma cannot load — avoids hard crashes. */
export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;

  if (globalForPrisma.prisma && !isPrismaClientHealthy(globalForPrisma.prisma)) {
    console.warn("[db] Stale Prisma client detected — recreating client");
    resetPrismaClient();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient() ?? undefined;
  }

  return globalForPrisma.prisma ?? null;
}

/** Lazy Prisma client — throws with a clear message when unavailable or stale. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    let client = getPrisma();
    if (!client) {
      throw new Error(
        "[db] Database is not configured or Prisma is unavailable. Run `npx prisma generate` and restart the dev server."
      );
    }

    let value = Reflect.get(client, prop, client) as unknown;

    // Heal stale singletons created before `prisma generate` (missing new models).
    if (
      value === undefined &&
      typeof prop === "string" &&
      (REQUIRED_PRISMA_DELEGATES as readonly string[]).includes(prop)
    ) {
      console.warn(`[db] Prisma delegate "${prop}" missing — resetting client`);
      resetPrismaClient();
      client = getPrisma();
      if (!client) {
        throw new Error(
          "[db] Prisma client unavailable after reset. Run `npx prisma generate` and restart the dev server."
        );
      }
      value = Reflect.get(client, prop, client) as unknown;
      if (value === undefined) {
        throw new Error(
          `[db] Prisma model "${prop}" is missing. Run \`npx prisma generate\` and restart the dev server.`
        );
      }
    }

    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
