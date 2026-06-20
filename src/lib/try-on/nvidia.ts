import sharp from "sharp";
import { TRY_ON_ENV } from "./env";
import { buildNvidiaKontextTryOnPrompt } from "./prompts";
import {
  nvcfAssetImageReference,
  uploadNvcfImageAsset,
} from "./nvidiaAssets";
import {
  readLocalPublicFileAsync,
  resolvePublicUrl,
  saveUploadBuffer,
} from "./storage";
import type { GenerateTryOnOptions, GenerateTryOnResponse, TryOnImageInput } from "./types";

type NvidiaArtifact = {
  base64?: string;
  finishReason?: string;
  seed?: number;
};

type NvidiaResponse = {
  artifacts?: NvidiaArtifact[];
  detail?: unknown;
  title?: string;
  status?: number;
};

function buildNvidiaInferUrl(): string {
  const base = TRY_ON_ENV.nvidiaApiBaseUrl.replace(/\/$/, "");
  const model = TRY_ON_ENV.nvidiaImageModel.replace(/^\/+|\/+$/g, "");
  return `${base}/genai/${model}`;
}

async function tryOnImageToJpegBuffer(img: TryOnImageInput): Promise<Buffer> {
  let raw: Buffer;

  if (img.b64Json) {
    raw = Buffer.from(img.b64Json, "base64");
  } else if (!img.url) {
    throw new Error("Image editing requires an input image URL or data");
  } else if (img.url.startsWith("data:")) {
    const m = /^data:([^;,]+)[^,]*;base64,(.+)$/i.exec(img.url);
    if (!m) throw new Error("Invalid data: image URL");
    raw = Buffer.from(m[2], "base64");
  } else {
    const fromDisk = await readLocalPublicFileAsync(img.url);
    if (fromDisk) {
      raw = fromDisk;
    } else {
      const resolved = resolvePublicUrl(img.url);
      const res = await fetch(resolved, {
        signal: AbortSignal.timeout(TRY_ON_ENV.nvidiaRequestTimeoutMs),
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch source image (HTTP ${res.status})`);
      }
      raw = Buffer.from(await res.arrayBuffer());
    }
  }

  return sharp(raw)
    .rotate()
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

function formatNvidiaHttpError(status: number, bodyText: string): string {
  const providerLabel = TRY_ON_ENV.nvidiaProviderDisplayName;
  const maxChars = 500;
  const short = bodyText.length > maxChars ? `${bodyText.slice(0, maxChars)}…` : bodyText;

  if (status === 422) {
    if (/example_id|base64/i.test(bodyText)) {
      return `${providerLabel} rejected the image format (422). Custom photos must use NVCF asset upload — retry after server restart. If this persists, set IMAGE_PROVIDER=gemini. ${short}`;
    }
    return `${providerLabel} could not process the request (422). Check image size/format and prompt. ${short}`;
  }
  if (status === 429) {
    return `${providerLabel} rate limit (429). Wait and try again. ${short}`;
  }
  if (status === 403 || status === 401) {
    return `${providerLabel} authorization failed (${status}). Check NVIDIA_API_KEY has "Public API Endpoints" scope from https://build.nvidia.com. ${short}`;
  }
  if (status === 503 || status === 502) {
    return `${providerLabel} temporarily unavailable (${status}). Try again in a moment. ${short}`;
  }
  return `${providerLabel} request failed (${status}): ${short}`;
}

function bufferFromNvidiaResponse(json: NvidiaResponse, providerLabel: string): Buffer {
  const artifact = json.artifacts?.[0];
  if (!artifact?.base64) {
    throw new Error(`${providerLabel} returned no image artifact`);
  }
  if (artifact.finishReason === "CONTENT_FILTERED") {
    throw new Error(`${providerLabel} blocked the result (content filter)`);
  }
  if (artifact.finishReason === "ERROR") {
    throw new Error(`${providerLabel} generation failed (ERROR finish reason)`);
  }
  return Buffer.from(artifact.base64, "base64");
}

export function isNvidiaCustomImageUnsupported(message: string): boolean {
  return /Expected:\s*example_id|got:\s*(base64|asset_id)/i.test(message);
}

export function isNvidiaConfigured(): boolean {
  return Boolean(TRY_ON_ENV.nvidiaApiKey);
}

export function nvidiaMissingConfigMessage(): string {
  return `Virtual try-on is not configured. Set NVIDIA_API_KEY from https://build.nvidia.com (enable "Public API Endpoints" when creating the key), set IMAGE_PROVIDER=nvidia, and restart the server. See .env.example.`;
}

export async function generateWithNvidia(
  options: GenerateTryOnOptions
): Promise<GenerateTryOnResponse> {
  const apiKey = TRY_ON_ENV.nvidiaApiKey;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  const personImage = options.originalImages?.[0];
  if (!personImage) {
    throw new Error("NVIDIA FLUX Kontext requires a person image");
  }

  const dims = options.targetDimensions;
  const providerLabel = TRY_ON_ENV.nvidiaProviderDisplayName;
  const url = buildNvidiaInferUrl();
  const prompt = options.prompt || buildNvidiaKontextTryOnPrompt({}, dims);

  const jpegBuffer = await tryOnImageToJpegBuffer(personImage);
  const contentType = "image/jpeg";

  console.log(`[TryOn] ${providerLabel}: uploading person image to NVCF assets…`);
  const assetId = await uploadNvcfImageAsset(
    jpegBuffer,
    contentType,
    apiKey,
    "vogo-fitting-room-person"
  );
  const image = nvcfAssetImageReference(assetId, contentType);

  const body: Record<string, unknown> = {
    prompt,
    image,
    aspect_ratio: TRY_ON_ENV.nvidiaAspectRatio,
    steps: TRY_ON_ENV.nvidiaSteps,
    cfg_scale: TRY_ON_ENV.nvidiaCfgScale,
    seed: TRY_ON_ENV.nvidiaSeed,
  };

  if (dims?.width && dims?.height && TRY_ON_ENV.nvidiaAspectRatio !== "match_input_image") {
    body.width = dims.width;
    body.height = dims.height;
  }

  const timeoutMs = TRY_ON_ENV.nvidiaRequestTimeoutMs;

  console.log(`[TryOn] ${providerLabel}: POST`, url, "model:", TRY_ON_ENV.nvidiaImageModel);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "NVCF-INPUT-ASSET-REFERENCES": assetId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${providerLabel} API request failed (${reason}). Check NVIDIA_API_KEY, network/firewall, and NVIDIA_REQUEST_TIMEOUT_MS (default ${TRY_ON_ENV.nvidiaRequestTimeoutMs}ms).`
    );
  }

  const text = await res.text();

  if (!res.ok) {
    console.error(`[TryOn] ${providerLabel} failed`, res.status, text.slice(0, 500));
    throw new Error(formatNvidiaHttpError(res.status, text));
  }

  let json: NvidiaResponse;
  try {
    json = JSON.parse(text) as NvidiaResponse;
  } catch {
    throw new Error(`${providerLabel} returned non-JSON response`);
  }

  const buffer = bufferFromNvidiaResponse(json, providerLabel);
  const { url: outUrl } = await saveUploadBuffer(
    buffer,
    `generated-${Date.now()}`,
    "image/jpeg"
  );
  return { url: outUrl };
}
