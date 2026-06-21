import { execSync } from "child_process";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";
import { getProjectRoot } from "./lib/next-bin.mjs";

const root = getProjectRoot();
const postgresSchema = "prisma/schema.postgresql.prisma";

function run(cmd, label) {
  console.log(`\n[netlify-build] ${label}\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

const databaseUrl = resolveDatabaseUrl();

if (databaseUrl?.startsWith("postgres")) {
  run(`npx prisma generate --schema=${postgresSchema}`, "Generate Prisma client (PostgreSQL)");
  run(`npx prisma db push --schema=${postgresSchema}`, "Sync PostgreSQL schema");
  run("npx tsx prisma/seed.ts", "Seed catalog (idempotent upserts)");
} else {
  console.warn(
    "[netlify-build] No PostgreSQL DATABASE_URL — skipping db push/seed.\n" +
      "  Enable Netlify DB: Site → Extensions → Netlify DB, then set DATABASE_URL to the provided URL."
  );
}

run("npm run build", "Next.js production build");
