const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const root = process.cwd();
const envPath = path.join(root, ".env");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const keys = [
  "GEMINI_API_KEY",
  "GEMINI_IMAGE_MODEL",
  "GEMINI_REQUEST_TIMEOUT_MS",
  "IMAGE_PROVIDER",
  "NVIDIA_API_KEY",
  "NVIDIA_IMAGE_MODEL",
  "NVIDIA_ATTEMPT_CUSTOM_PHOTOS",
  "AUTH_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];

const local = parseEnvFile(envPath);
const toSet = keys.filter((k) => local[k]);

if (toSet.length === 0) {
  console.log("No .env keys to sync.");
  process.exit(0);
}

for (const key of toSet) {
  const value = local[key].replace(/"/g, '\\"');
  console.log(`Setting ${key} on Netlify production…`);
  execSync(
    `netlify env:set ${key} "${value}" --context production --site ${siteId} --force`,
    { cwd: root, stdio: "inherit" }
  );
}

console.log(`Synced ${toSet.length} env var(s) to Netlify production.`);
