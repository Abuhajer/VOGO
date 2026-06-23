/**
 * NVIDIA try-on probe (no Next.js server required).
 *
 * Usage:
 *   npm run probe:qwen
 *   npm run probe:qwen -- --provider flux --demo   # NVIDIA demo image only (proves API key)
 *   node --env-file=.env scripts/probe-qwen-tryon.mjs --person public/fitting-room/avatars/model-classic.jpg
 *
 * Providers:
 *   qwen  — Qwen Image Edit via integrate.api.nvidia.com (needs model enabled on your NVIDIA key)
 *   flux  — FLUX Kontext via ai.api.nvidia.com (works with most build.nvidia.com keys)
 *   klein — FLUX.2 Klein 4B (multi-image edit; experimental)
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

const apiKey = process.env.NVIDIA_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing NVIDIA_API_KEY. Get one at https://build.nvidia.com → any model → Get API Key");
  process.exit(1);
}

const args = process.argv.slice(2);
const providerArgIdx = args.indexOf("--provider");
const personArgIdx = args.indexOf("--person");
const garmentArgIdx = args.indexOf("--garment");
const demoMode = args.includes("--demo");

const modelEnv = process.env.NVIDIA_IMAGE_MODEL?.trim() || "qwen/qwen-image-edit-2511";
let provider =
  providerArgIdx >= 0 && args[providerArgIdx + 1]
    ? args[providerArgIdx + 1].toLowerCase()
    : /klein/i.test(modelEnv)
      ? "klein"
      : /kontext|flux/i.test(modelEnv)
        ? "flux"
        : "qwen";

const personPath = resolve(
  root,
  personArgIdx >= 0 && args[personArgIdx + 1]
    ? args[personArgIdx + 1]
    : "public/fitting-room/avatars/model-classic.jpg"
);
const garmentPath = resolve(
  root,
  garmentArgIdx >= 0 && args[garmentArgIdx + 1]
    ? args[garmentArgIdx + 1]
    : "public/images/products/classic-black-tuxedo.png"
);

const promptQwen = `Virtual try-on inpainting for luxury menswear. Image 1 is the person — preserve face, hair, skin, hands, pose, background, lighting, and camera angle exactly; change clothing only. Image 2 is the catalog garment reference — match its color, cut, lapels, and fabric on the person. Do NOT zoom, crop, reframe, or beautify.`;

const promptFlux = `Virtual try-on inpainting for luxury menswear on the person in the photo. Replace ONLY the clothing with a classic black evening tuxedo: black jacket, peaked lapels, white shirt, black bow tie. Preserve face, hair, skin, hands, pose, background, lighting, and camera angle exactly. Do NOT zoom, crop, reframe, or beautify.`;

const timeoutMs = Number(process.env.NVIDIA_REQUEST_TIMEOUT_MS || 180_000);

async function toJpegBuffer(filePath) {
  return sharp(readFileSync(filePath)).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

async function uploadAsset(buffer, description) {
  const createRes = await fetch("https://api.nvcf.nvidia.com/v2/nvcf/assets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ contentType: "image/jpeg", description }),
    signal: AbortSignal.timeout(60_000),
  });
  const createText = await createRes.text();
  if (!createRes.ok) {
    throw new Error(`NVCF asset create ${createRes.status}: ${createText.slice(0, 400)}`);
  }
  const { assetId, uploadUrl } = JSON.parse(createText);
  if (!assetId || !uploadUrl) throw new Error("NVCF response missing assetId/uploadUrl");

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
      "x-amz-meta-nvcf-asset-description": description,
    },
    body: buffer,
    signal: AbortSignal.timeout(120_000),
  });
  if (!putRes.ok) {
    const err = await putRes.text().catch(() => "");
    throw new Error(`NVCF upload ${putRes.status}: ${err.slice(0, 400)}`);
  }
  return {
    assetId,
    ref: `data:image/jpeg;asset_id,${assetId}`,
  };
}

function saveB64(b64, prefix) {
  const outDir = join(root, "scripts", "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${prefix}-${Date.now()}.jpg`);
  writeFileSync(outPath, Buffer.from(b64, "base64"));
  return outPath;
}

function bufferFromInferJson(json) {
  const b64 = json?.artifacts?.[0]?.base64;
  if (!b64) throw new Error("No artifacts[0].base64 in infer response");
  return Buffer.from(b64, "base64");
}

function b64FromOpenAiEdit(json) {
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No data[0].b64_json in edits response");
  return b64;
}

async function probeQwen(personJpeg, garmentJpeg, size) {
  const modelId = modelEnv.includes("/")
    ? modelEnv.split("/").pop()
    : modelEnv;
  const openAiBase =
    process.env.NVIDIA_OPENAI_API_BASE_URL?.trim() ||
    "https://integrate.api.nvidia.com/v1";
  const editsUrl = `${openAiBase.replace(/\/$/, "")}/images/edits`;

  console.log("  endpoint:", editsUrl);
  console.log("  model:", modelId);

  const personAsset = await uploadAsset(personJpeg, "vogo-qwen-person");
  const garmentAsset = await uploadAsset(garmentJpeg, "vogo-qwen-garment");

  const body = {
    model: modelId,
    prompt: promptQwen,
    image: [personAsset.ref, garmentAsset.ref],
    n: 1,
    response_format: "b64_json",
  };
  if (size) body.size = size;

  const res = await fetch(editsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "NVCF-INPUT-ASSET-REFERENCES": [personAsset.assetId, garmentAsset.assetId].join(","),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 404
        ? "\n\nQwen Image Edit is not enabled on your NVIDIA API key.\n" +
          "  1. Open https://build.nvidia.com and search \"Qwen Image Edit\"\n" +
          "  2. Open the model page → Get API Key (Public API Endpoints scope)\n" +
          "  3. Replace NVIDIA_API_KEY in .env and rerun\n" +
          "  Or test FLUX now: npm run probe:qwen -- --provider flux"
        : "";
    throw new Error(`Qwen edits ${res.status}: ${text.slice(0, 500)}${hint}`);
  }
  return saveB64(b64FromOpenAiEdit(JSON.parse(text)), "qwen-probe");
}

async function probeFlux(personJpeg, size) {
  const url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev";
  console.log("  endpoint:", url);

  let body;
  let assetHeader;

  if (demoMode) {
    console.log("  mode: demo (NVIDIA example_id — custom photos blocked on hosted trial)");
    body = {
      prompt: promptFlux,
      image: "data:image/jpeg;example_id,2",
      aspect_ratio: "match_input_image",
      steps: Number(process.env.NVIDIA_STEPS || 28),
      cfg_scale: Number(process.env.NVIDIA_CFG_SCALE || 3.5),
      seed: Number(process.env.NVIDIA_SEED || 0),
    };
  } else {
    const personAsset = await uploadAsset(personJpeg, "vogo-flux-person");
    assetHeader = personAsset.assetId;
    body = {
      prompt: promptFlux,
      image: personAsset.ref,
      aspect_ratio: "match_input_image",
      steps: Number(process.env.NVIDIA_STEPS || 30),
      cfg_scale: Number(process.env.NVIDIA_CFG_SCALE || 3.5),
      seed: Number(process.env.NVIDIA_SEED || 0),
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(assetHeader ? { "NVCF-INPUT-ASSET-REFERENCES": assetHeader } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 422 && text.includes("example_id")
        ? "\n\nHosted NVIDIA FLUX only accepts demo images. Use --demo to verify your key,\n" +
          "or run Qwen locally on your GPU (see README in probe output below)."
        : "";
    throw new Error(`FLUX Kontext ${res.status}: ${text.slice(0, 500)}${hint}`);
  }
  const outDir = join(root, "scripts", "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `flux-probe-${demoMode ? "demo-" : ""}${Date.now()}.jpg`);
  writeFileSync(outPath, bufferFromInferJson(JSON.parse(text)));
  return outPath;
}

async function probeKlein(personJpeg, garmentJpeg) {
  const url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";
  console.log("  endpoint:", url);

  const personAsset = await uploadAsset(personJpeg, "vogo-klein-person");
  const garmentAsset = await uploadAsset(garmentJpeg, "vogo-klein-garment");

  const body = {
    prompt: promptQwen,
    image: [personAsset.ref, garmentAsset.ref],
    aspect_ratio: "match_input_image",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "NVCF-INPUT-ASSET-REFERENCES": [personAsset.assetId, garmentAsset.assetId].join(","),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`FLUX Klein ${res.status}: ${text.slice(0, 500)}`);
  }
  const outDir = join(root, "scripts", "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `klein-probe-${Date.now()}.jpg`);
  writeFileSync(outPath, bufferFromInferJson(JSON.parse(text)));
  return outPath;
}

console.log("VOGO NVIDIA probe");
console.log("  provider:", provider);
console.log("  person:", personPath);
console.log("  garment:", garmentPath);

const personJpeg = await toJpegBuffer(personPath);
const garmentJpeg = await toJpegBuffer(garmentPath);
const meta = await sharp(personJpeg).metadata();
const size = meta.width && meta.height ? `${meta.width}x${meta.height}` : undefined;
console.log("  person size:", size ?? "unknown");
console.log("  uploading…");

const started = Date.now();
let outPath;

try {
  if (provider === "flux") {
    outPath = await probeFlux(personJpeg, size);
  } else if (provider === "klein") {
    outPath = await probeKlein(personJpeg, garmentJpeg);
  } else {
    outPath = await probeQwen(personJpeg, garmentJpeg, size);
  }
} catch (err) {
  console.error("\nFAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
}

console.log(`\nOK in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log("  saved:", outPath);

if (demoMode) {
  console.log("\nNote: demo mode uses NVIDIA sample images, not your fitting-room photos.");
}

console.log("\n--- Qwen on your PC (RTX 3060 6GB) ---");
console.log("Yes, you can download Qwen Image Edit, but NOT inside VOGO directly.");
console.log("Use ComfyUI + GGUF/FP8 quantized weights (~6GB VRAM with Q4_K_M).");
console.log("Model: https://huggingface.co/Qwen/Qwen-Image-Edit-2511");
console.log("Quantized: https://huggingface.co/QuantStack/Qwen-Image-Edit-GGUF");
console.log("Expect ~2-5 min per image on 6GB; 16GB+ system RAM recommended.");
console.log("\n--- Qwen via NVIDIA cloud ---");
console.log("Your key does not expose qwen-image-edit-2511 yet (integrate API → 404).");
console.log("Search build.nvidia.com for \"Qwen Image Edit\" and regenerate API key from that page.");
console.log("\n--- VOGO app .env (when Qwen API works) ---");
if (provider === "qwen") {
  console.log("  IMAGE_PROVIDER=nvidia");
  console.log("  NVIDIA_IMAGE_MODEL=qwen/qwen-image-edit-2511");
  console.log("  NVIDIA_QWEN_USE_GARMENT_IMAGE=true");
  console.log("  NVIDIA_ATTEMPT_CUSTOM_PHOTOS=true");
} else if (provider === "klein") {
  console.log("  IMAGE_PROVIDER=nvidia");
  console.log("  NVIDIA_IMAGE_MODEL=black-forest-labs/flux.2-klein-4b");
  console.log("  (klein provider not wired in app yet — flux/qwen only)");
} else {
  console.log("  IMAGE_PROVIDER=nvidia");
  console.log("  NVIDIA_IMAGE_MODEL=black-forest-labs/flux.1-kontext-dev");
  console.log("  NVIDIA_ATTEMPT_CUSTOM_PHOTOS=true");
}
console.log("Then: npm run dev → fitting room");
