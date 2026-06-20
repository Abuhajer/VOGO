import { TRY_ON_ENV } from "./env";
import {
  buildGeminiRequestUrl,
  getGeminiRuntimeConfig,
  type GeminiFileDefaults,
  type GeminiRuntimeConfig,
} from "./geminiConfig";
import {
  readLocalPublicFileAsync,
  resolvePublicUrl,
  saveUploadBuffer,
} from "./storage";
import { mimeFromPublicPath } from "./mime";
import type { GenerateTryOnOptions, GenerateTryOnResponse, TryOnImageInput } from "./types";

type GeminiApiErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<Record<string, unknown>>;
  };
};

function parseRetryDelaySeconds(
  body: GeminiApiErrorBody,
  http: GeminiFileDefaults["http"]
): number | null {
  const { retryDelayMinSeconds: lo, retryDelayMaxSeconds: hi } = http;
  const details = body.error?.details;
  if (Array.isArray(details)) {
    for (const d of details) {
      const t = d["@type"];
      if (typeof t === "string" && t.includes("RetryInfo")) {
        const rd = d.retryDelay;
        if (typeof rd === "string") {
          const m = /^(\d+(?:\.\d+)?)s$/i.exec(rd.trim());
          if (m) {
            const sec = parseFloat(m[1]);
            if (!Number.isNaN(sec)) {
              return Math.min(hi, Math.max(lo, Math.ceil(sec)));
            }
          }
        }
      }
    }
  }
  const msg = body.error?.message ?? "";
  const m2 = /retry in ([\d.]+)s/i.exec(msg);
  if (m2) {
    const sec = parseFloat(m2[1]);
    if (!Number.isNaN(sec)) {
      return Math.min(hi, Math.max(lo, Math.ceil(sec)));
    }
  }
  return null;
}

function formatHttpError(
  cfg: GeminiRuntimeConfig,
  status: number,
  bodyText: string,
  providerLabel: string
): string {
  const maxChars = cfg.http.errorBodyMaxChars;
  if (status !== 429) {
    const short = bodyText.length > maxChars ? `${bodyText.slice(0, maxChars)}…` : bodyText;
    if (status === 503 || status === 502) {
      return `${providerLabel} temporarily unavailable (${status}). Try again in a moment. ${short}`;
    }
    return `${providerLabel} request failed (${status}): ${short}`;
  }
  let parsed: GeminiApiErrorBody = {};
  try {
    parsed = JSON.parse(bodyText) as GeminiApiErrorBody;
  } catch {
    const limits = TRY_ON_ENV.geminiRateLimitsDocUrl;
    return `${providerLabel} rate limit (429). Wait and try again.${limits ? ` ${limits}` : ""}`;
  }
  const msg = parsed.error?.message ?? "";
  const retrySec = parseRetryDelaySeconds(parsed, cfg.http);
  const waitPart = retrySec ? ` Suggested wait before retry: ~${retrySec}s.` : "";
  let quotaPart = "";
  try {
    if (new RegExp(cfg.messages.quotaHintRegex, "i").test(msg)) {
      quotaPart = ` Free-tier quota for this model may be exhausted — adjust ${cfg.messages.modelEnvVarName}, wait, or enable billing.${TRY_ON_ENV.imageProviderKeysHelpUrl ? ` ${TRY_ON_ENV.imageProviderKeysHelpUrl}` : ""}`;
    }
  } catch {
    /* invalid regex */
  }
  const limits = TRY_ON_ENV.geminiRateLimitsDocUrl;
  return `${providerLabel} rate limit (429).${waitPart}${quotaPart}${limits ? ` ${limits}` : ""}`;
}

type GeminiJsonPart = {
  text?: string;
  thought?: boolean;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

function bufferFromGeminiResponse(
  json: unknown,
  providerLabel: string
): { buffer: Buffer; mime: string } {
  const root = json as {
    candidates?: Array<{ content?: { parts?: GeminiJsonPart[] }; finishReason?: string }>;
    error?: { message?: string; code?: number };
    promptFeedback?: { blockReason?: string };
  };
  if (root.error?.message) {
    throw new Error(`${providerLabel} API: ${root.error.message}`);
  }
  if (root.promptFeedback?.blockReason) {
    throw new Error(`${providerLabel} blocked the prompt: ${root.promptFeedback.blockReason}`);
  }

  const textSnippets: string[] = [];
  const nonThoughtImages: Array<{ buffer: Buffer; mime: string }> = [];
  const thoughtImages: Array<{ buffer: Buffer; mime: string }> = [];

  for (const cand of root.candidates ?? []) {
    const parts = cand.content?.parts;
    if (!parts?.length) continue;
    for (const p of parts) {
      if (typeof p.text === "string" && p.text.trim()) {
        const t = p.text.trim();
        textSnippets.push(t.length > 280 ? `${t.slice(0, 280)}…` : t);
      }
      const inline = p.inline_data || p.inlineData;
      const mime = p.inline_data?.mime_type || p.inlineData?.mimeType || "image/png";
      const data = inline?.data;
      if (typeof data === "string" && data.length > 0) {
        const buffer = Buffer.from(data, "base64");
        if (p.thought) {
          thoughtImages.push({ buffer, mime });
        } else {
          nonThoughtImages.push({ buffer, mime });
        }
      }
    }
  }

  const pick =
    nonThoughtImages.length > 0
      ? nonThoughtImages[nonThoughtImages.length - 1]
      : thoughtImages.length > 0
        ? thoughtImages[thoughtImages.length - 1]
        : null;

  if (pick) {
    return { buffer: pick.buffer, mime: pick.mime };
  }

  const finish = (root.candidates ?? [])
    .map((c) => c.finishReason)
    .filter(Boolean)
    .join(", ");
  const textHint = textSnippets.length ? ` Model text: ${textSnippets.join(" | ")}` : "";
  throw new Error(
    `${providerLabel} returned no image part${finish ? ` (finishReason: ${finish})` : ""}.${textHint} Use a native image model (e.g. gemini-2.5-flash-image), set generation responseModalities to include IMAGE, or override with GEMINI_GENERATION_CONFIG_JSON. For slow runs, raise GEMINI_REQUEST_TIMEOUT_MS (default ${TRY_ON_ENV.geminiRequestTimeoutMs}ms).`
  );
}

async function originalImageToGeminiInlinePart(img: TryOnImageInput): Promise<{
  inlineData: { mimeType: string; data: string };
}> {
  if (img.b64Json) {
    return {
      inlineData: {
        mimeType: (img.mimeType?.split(";")[0] || "image/png").trim(),
        data: img.b64Json,
      },
    };
  }
  if (!img.url) {
    throw new Error("Image editing requires an input image URL or data");
  }
  if (img.url.startsWith("data:")) {
    const m = /^data:([^;,]+)[^,]*;base64,(.+)$/i.exec(img.url);
    if (!m) throw new Error("Invalid data: image URL");
    return { inlineData: { mimeType: m[1].trim(), data: m[2] } };
  }

  const fromDisk = await readLocalPublicFileAsync(img.url);
  if (fromDisk) {
    const mime =
      img.mimeType?.split(";")[0]?.trim() || mimeFromPublicPath(img.url);
    return { inlineData: { mimeType: mime, data: fromDisk.toString("base64") } };
  }

  const resolved = resolvePublicUrl(img.url);
  if (resolved.startsWith("data:")) {
    const m = /^data:([^;,]+)[^,]*;base64,(.+)$/i.exec(resolved);
    if (!m) throw new Error("Invalid data: image URL");
    return { inlineData: { mimeType: m[1].trim(), data: m[2] } };
  }

  let r: Response;
  try {
    r = await fetch(resolved, {
      signal: AbortSignal.timeout(TRY_ON_ENV.geminiRequestTimeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not fetch source image (${reason}). URL: ${resolved.slice(0, 120)}${resolved.length > 120 ? "…" : ""}`
    );
  }
  if (!r.ok) {
    throw new Error(`Failed to fetch source image (HTTP ${r.status})`);
  }
  const mime =
    r.headers.get("content-type")?.split(";")[0].trim() ||
    img.mimeType?.split(";")[0] ||
    "image/jpeg";
  const buf = Buffer.from(await r.arrayBuffer());
  return { inlineData: { mimeType: mime.trim(), data: buf.toString("base64") } };
}

export function isGeminiConfigured(): boolean {
  return Boolean(TRY_ON_ENV.geminiApiKey);
}

export function geminiMissingConfigMessage(): string {
  const help = TRY_ON_ENV.imageProviderKeysHelpUrl;
  return `Virtual try-on is not configured. Set GEMINI_API_KEY (https://aistudio.google.com/apikey). Optional: GEMINI_IMAGE_MODEL. Restart the server.${help ? ` Docs: ${help}` : " See .env.example."}`;
}

const GEMINI_ASPECT_RATIOS: Array<{ label: string; value: number }> = [
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
];

function closestGeminiAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  let best = GEMINI_ASPECT_RATIOS[0];
  let bestDiff = Infinity;
  for (const option of GEMINI_ASPECT_RATIOS) {
    const diff = Math.abs(Math.log(ratio) - Math.log(option.value));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = option;
    }
  }
  return best.label;
}

function buildGenerationConfig(
  base: Record<string, unknown>,
  targetDimensions?: { width: number; height: number }
): Record<string, unknown> {
  if (!targetDimensions?.width || !targetDimensions?.height) {
    return base;
  }
  const aspectRatio = closestGeminiAspectRatio(
    targetDimensions.width,
    targetDimensions.height
  );
  return {
    ...base,
    aspectRatio,
  };
}

export async function generateWithGemini(
  options: GenerateTryOnOptions
): Promise<GenerateTryOnResponse> {
  const cfg = getGeminiRuntimeConfig();
  const apiKey = TRY_ON_ENV.geminiApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = TRY_ON_ENV.geminiImageModel;
  const url = buildGeminiRequestUrl(cfg, model);
  const providerLabel = TRY_ON_ENV.geminiProviderDisplayName;

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (options.multimodalParts?.length) {
    for (const part of options.multimodalParts) {
      if (part.type === "text") {
        parts.push({ text: part.text });
      } else {
        parts.push(await originalImageToGeminiInlinePart(part.image));
      }
    }
  } else {
    parts.push({ text: options.prompt });
    for (const img of options.originalImages ?? []) {
      parts.push(await originalImageToGeminiInlinePart(img));
    }
  }

  const body = {
    contents: [{ role: cfg.userContentRole, parts }],
    generationConfig: buildGenerationConfig(cfg.effectiveGenerationConfig, options.targetDimensions),
  };

  const timeoutMs = TRY_ON_ENV.geminiRequestTimeoutMs;
  const maxAttempts = TRY_ON_ENV.imageHttp429MaxAttempts;

  console.log(`[TryOn] ${providerLabel}: POST`, url.replace(/\?.*$/, ""), "model:", model);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      console.warn(`[TryOn] ${providerLabel}: retry ${attempt + 1}/${maxAttempts}`);
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [TRY_ON_ENV.geminiApiKeyHeader]: apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(
        `${providerLabel} API request failed (${reason}). Check GEMINI_API_KEY, network/firewall, and GEMINI_REQUEST_TIMEOUT_MS (default ${TRY_ON_ENV.geminiRequestTimeoutMs}ms).`
      );
    }

    const text = await res.text();

    if (res.ok) {
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`${providerLabel} returned non-JSON response`);
      }
      const { buffer, mime } = bufferFromGeminiResponse(json, providerLabel);
      const { url: outUrl } = await saveUploadBuffer(
        buffer,
        `generated-${Date.now()}`,
        mime
      );
      return { url: outUrl };
    }

    const canRetry = attempt < maxAttempts - 1;

    if (canRetry && res.status === 429) {
      let parsed: GeminiApiErrorBody = {};
      try {
        parsed = JSON.parse(text) as GeminiApiErrorBody;
      } catch {
        /* use default wait */
      }
      const parsedWait = parseRetryDelaySeconds(parsed, cfg.http);
      const exponential = Math.min(
        cfg.http.retryDelayMaxSeconds,
        cfg.http.retry429FallbackSeconds * Math.pow(2, attempt)
      );
      const waitSec = parsedWait ?? exponential;
      console.warn(`[TryOn] ${providerLabel}: HTTP 429, waiting ${waitSec}s (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise<void>((r) => setTimeout(r, waitSec * 1000));
      continue;
    }

    if (canRetry && (res.status === 503 || res.status === 502)) {
      const waitSec = Math.min(15, 3 * (attempt + 1));
      console.warn(`[TryOn] ${providerLabel}: HTTP ${res.status}, waiting ${waitSec}s`);
      await new Promise<void>((r) => setTimeout(r, waitSec * 1000));
      continue;
    }

    console.error(`[TryOn] ${providerLabel} failed`, res.status, text.slice(0, cfg.http.errorBodyMaxChars));
    throw new Error(formatHttpError(cfg, res.status, text, providerLabel));
  }

  throw new Error(`${providerLabel}: exhausted retries`);
}
