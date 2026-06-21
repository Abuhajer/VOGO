#!/usr/bin/env node
/**
 * Linux Docker build + Netlify production deploy (avoids Windows sharp binaries).
 * Usage: node scripts/netlify-docker-deploy.mjs
 */
import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const SITE_ID = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const root = process.cwd();

function readNetlifyToken() {
  const candidates = [
    join(process.env.APPDATA ?? "", "netlify", "Config", "config.json"),
    join(homedir(), ".netlify", "config.json"),
    join(homedir(), ".config", "netlify", "config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const config = JSON.parse(readFileSync(path, "utf8"));
    const users = config.users ?? {};
    for (const user of Object.values(users)) {
      const token = user?.auth?.token;
      if (token) return token;
    }
  }
  throw new Error("Netlify auth token not found. Run: netlify login");
}

const token = readNetlifyToken();
const volumeSource = process.platform === "win32" ? root.replace(/\\/g, "/") : root;

console.log("[netlify-docker-deploy] Building on Linux via Docker…");

const shellScript = `
set -euo pipefail
export NETLIFY=true
export NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN"
export NETLIFY_SITE_ID="$NETLIFY_SITE_ID"
export npm_config_cache=/tmp/npm-cache
npm ci
npm install -g netlify-cli@23.12.3
# Avoid ENOTEMPTY when plugin rebuilds functions-internal on a bind-mounted workspace.
rm -rf .netlify/functions-internal .netlify/static .netlify/edge-functions .netlify/deploy
rm -rf .next/cache
set +e
netlify build
BUILD_EXIT=$?
set -e
echo "[deploy] build exit: $BUILD_EXIT"
du -sh .netlify/functions-internal/* 2>/dev/null || true
if [ ! -d .netlify/functions-internal ]; then
  echo "[deploy] Missing .netlify/functions-internal — aborting"
  exit 1
fi
if [ ! -d .netlify/static ]; then
  echo "[deploy] Missing .netlify/static — aborting"
  exit 1
fi
netlify deploy --prod --no-build --dir=.netlify/static --functions=.netlify/functions-internal --skip-functions-cache
`.trim();

const dockerArgs = [
  "run",
  "--rm",
  "--network=host",
  "-v",
  `${volumeSource}:/app`,
  "-v",
  "/app/node_modules",
  "-v",
  "/app/.next",
  "-w",
  "/app",
  "-e",
  `NETLIFY_AUTH_TOKEN=${token}`,
  "-e",
  `NETLIFY_SITE_ID=${SITE_ID}`,
  "-e",
  "NETLIFY=true",
  "node:20-bookworm",
  "bash",
  "-lc",
  shellScript,
];

const result = spawnSync("docker", dockerArgs, {
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("[netlify-docker-deploy] Done.");

execSync("node scripts/netlify-deploy-status.cjs", { stdio: "inherit", cwd: root });
