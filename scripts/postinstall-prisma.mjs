import { execSync } from "child_process";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";
import { getProjectRoot } from "./lib/next-bin.mjs";

const root = getProjectRoot();
const url = resolveDatabaseUrl();
const isNetlify = process.env.NETLIFY === "true";
const usePostgres = isNetlify || url?.startsWith("postgres");
const schema = usePostgres ? "prisma/schema.postgresql.prisma" : "prisma/schema.prisma";

execSync(`npx prisma generate --schema=${schema}`, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

console.log(`[postinstall-prisma] Generated client from ${schema}`);
