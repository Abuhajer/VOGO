import sharp from "sharp";
import { TRY_ON_ENV } from "./env";
import {
  readLocalPublicFileAsync,
  resolvePublicUrl,
  saveUploadBuffer,
} from "./storage";
import type { GenerateTryOnResponse, TryOnImageInput } from "./types";

export type NvidiaArtifact = {
  base64?: string;
  finishReason?: string;
  seed?: number;
};

export type NvidiaInferResponse = {
  artifacts?: NvidiaArtifact[];
  detail?: unknown;
  title?: string;
  status?: number;
};

export type NvidiaOpenAiEditResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

export function isNvidiaQwenModel(model = TRY_ON_ENV.nvidiaImageModel): boolean {
  return model.toLowerCase().includes("qwen");
}

/** qwen-image-edit-2509 / 2511 accept up to 3 reference images. */
export function nvidiaQwenSupportsMultiImage(model = TRY_ON_ENV.nvidiaImageModel): boolean {
  const id = model.toLowerCase();
  return id.includes("2511") || id.includes("2509");
}

export function normalizeNvidiaModelSlug(model = TRY_ON_ENV.nvidiaImageModel): string {
  return model.replace(/^\/+|\/+$/g, "");
}

/** Model-scoped GenAI base, e.g. https://ai.api.nvidia.com/v1/genai/qwen/qwen-image-edit-2511 */
export function buildNvidiaGenAiBaseUrl(model = TRY_ON_ENV.nvidiaImageModel): string {
  const base = TRY_ON_ENV.nvidiaApiBaseUrl.replace(/\/$/, "");
  return `${base}/genai/${normalizeNvidiaModelSlug(model)}`;
}

/** Qwen uses /infer; FLUX Kontext posts to the genai base path directly. */
export function buildNvidiaGenAiInferUrl(model = TRY_ON_ENV.nvidiaImageModel): string {
  if (isNvidiaQwenModel(model)) {
    return `${buildNvidiaGenAiBaseUrl(model)}/infer`;
  }
  return buildNvidiaGenAiBaseUrl(model);
}

/** Short OpenAI model id, e.g. qwen-image-edit-2511 (not qwen/qwen-image-edit-2511). */
export function normalizeNvidiaQwenOpenAiModelId(model = TRY_ON_ENV.nvidiaImageModel): string {
  const slug = normalizeNvidiaModelSlug(model);
  const parts = slug.split("/");
  return parts[parts.length - 1] ?? slug;
}

/** Qwen Image Edit uses integrate.api.nvidia.com OpenAI-compatible /images/edits. */
export function buildNvidiaOpenAiEditsUrl(): string {
  const base = TRY_ON_ENV.nvidiaOpenAiApiBaseUrl.replace(/\/$/, "");
  return `${base}/images/edits`;
}

export async function tryOnImageToJpegBuffer(img: TryOnImageInput): Promise<Buffer> {
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

export function formatNvidiaHttpError(status: number, bodyText: string): string {
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
  if (status === 404) {
    return `${providerLabel} model endpoint not found (404). Verify NVIDIA_IMAGE_MODEL is enabled for your API key at https://build.nvidia.com (e.g. qwen/qwen-image-edit-2511). Set GEMINI_API_KEY for automatic fallback. ${short}`;
  }
  if (status === 503 || status === 502) {
    return `${providerLabel} temporarily unavailable (${status}). Try again in a moment. ${short}`;
  }
  return `${providerLabel} request failed (${status}): ${short}`;
}

export function bufferFromNvidiaInferResponse(
  json: NvidiaInferResponse,
  providerLabel: string
): Buffer {
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

export function bufferFromOpenAiEditResponse(
  json: NvidiaOpenAiEditResponse,
  providerLabel: string
): Buffer {
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    const msg = json.error?.message;
    throw new Error(
      msg ? `${providerLabel} edit failed: ${msg}` : `${providerLabel} returned no image data`
    );
  }
  return Buffer.from(b64, "base64");
}

export async function saveGeneratedImage(buffer: Buffer): Promise<GenerateTryOnResponse> {
  const { url } = await saveUploadBuffer(buffer, `generated-${Date.now()}`, "image/jpeg");
  return { url };
}

export function isNvidiaCustomImageUnsupported(message: string): boolean {
  return /Expected:\s*example_id|got:\s*(base64|asset_id)/i.test(message);
}

/** NVIDIA failures where Gemini fallback is appropriate when configured. */
export function isNvidiaFallbackEligible(message: string): boolean {
  return (
    isNvidiaCustomImageUnsupported(message) ||
    /request failed \(404\)|404 page not found|endpoint not found \(404\)/i.test(message)
  );
}

export function isNvidiaEndpointNotFound(message: string): boolean {
  return /\(\s*404\s*\)|\b404\b|page not found|endpoint not found|model endpoint not found/i.test(
    message
  );
}

export function isNvidiaConfigured(): boolean {
  return Boolean(TRY_ON_ENV.nvidiaApiKey);
}

export function nvidiaMissingConfigMessage(): string {
  return `Virtual try-on is not configured. Set NVIDIA_API_KEY from https://build.nvidia.com (enable "Public API Endpoints" when creating the key), set IMAGE_PROVIDER=nvidia, and restart the server. See .env.example.`;
}
