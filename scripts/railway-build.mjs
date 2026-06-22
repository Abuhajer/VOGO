#!/usr/bin/env node
/**
 * Railway production build — PostgreSQL Prisma + Next.js (no Netlify serverless hacks).
 */
import { execSync } from "child_process";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";
import { getProjectRoot } from "./lib/next-bin.mjs";

const root = getProjectRoot();
const postgresSchema = "prisma/schema.postgresql.prisma";

function run(cmd, label) {
  console.log(`\n[railway-build] ${label}\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

run(`npx prisma generate --schema=${postgresSchema}`, "Generate Prisma client (PostgreSQL)");

// DB sync runs in railway.toml releaseCommand (runtime network to Postgres).
const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl?.startsWith("postgres")) {
  console.warn(
    "[railway-build] No PostgreSQL DATABASE_URL at build — static catalog until releaseCommand runs."
  );
}

run("npm run build", "Next.js production build");
