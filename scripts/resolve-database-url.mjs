/**
 * Netlify DB exposes NETLIFY_DATABASE_URL. Prisma expects DATABASE_URL.
 * Call before any prisma command in CI / Netlify build.
 */
export function resolveDatabaseUrl() {
  const netlifyUrl = process.env.NETLIFY_DATABASE_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl && netlifyUrl) {
    process.env.DATABASE_URL = netlifyUrl;
    console.log("[db] Using NETLIFY_DATABASE_URL as DATABASE_URL");
    return netlifyUrl;
  }

  if (databaseUrl) {
    return databaseUrl;
  }

  return null;
}
