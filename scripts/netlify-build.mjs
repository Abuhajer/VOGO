import { execSync } from "child_process";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";
import { getProjectRoot } from "./lib/next-bin.mjs";

const root = getProjectRoot();
const postgresSchema = "prisma/schema.postgresql.prisma";
const isNetlify = process.env.NETLIFY === "true";

function run(cmd, label) {
  console.log(`\n[netlify-build] ${label}\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

const databaseUrl = resolveDatabaseUrl();

// Netlify always uses the PostgreSQL Prisma client (Linux binary target).
run(`npx prisma generate --schema=${postgresSchema}`, "Generate Prisma client (PostgreSQL)");

if (databaseUrl?.startsWith("postgres")) {
  run(`npx prisma db push --schema=${postgresSchema}`, "Sync PostgreSQL schema");
  run("npx tsx prisma/seed.ts", "Seed catalog (idempotent upserts)");
} else {
  console.warn(
    "[netlify-build] No PostgreSQL DATABASE_URL — skipping db push/seed.\n" +
      "  Site runs on static catalog fallbacks until DATABASE_URL is set in Netlify env.\n" +
      "  Enable Netlify DB: Site → Extensions → Netlify DB, then set DATABASE_URL."
  );
}

run("npm run build", "Next.js production build");
