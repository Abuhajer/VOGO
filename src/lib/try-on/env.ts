/** Server-only Gemini / try-on environment (never import from client components). */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function floatEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const TRY_ON_ENV = {
  imageProvider: process.env.IMAGE_PROVIDER?.trim().toLowerCase() || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? "",
  geminiImageModel:
    process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image",
  geminiRequestTimeoutMs: intEnv("GEMINI_REQUEST_TIMEOUT_MS", 120_000),
  geminiApiBaseUrl: process.env.GEMINI_API_BASE_URL?.trim() ?? "",
  geminiApiKeyHeader:
    process.env.GEMINI_API_KEY_HEADER?.trim() || "x-goog-api-key",
  geminiProviderDisplayName:
    process.env.GEMINI_PROVIDER_DISPLAY_NAME?.trim() || "Gemini",
  nvidiaApiKey: process.env.NVIDIA_API_KEY?.trim() ?? "",
  nvidiaImageModel:
    process.env.NVIDIA_IMAGE_MODEL?.trim() || "black-forest-labs/flux.1-kontext-dev",
  nvidiaApiBaseUrl:
    process.env.NVIDIA_API_BASE_URL?.trim() || "https://ai.api.nvidia.com/v1",
  nvidiaRequestTimeoutMs: intEnv("NVIDIA_REQUEST_TIMEOUT_MS", 120_000),
  nvidiaProviderDisplayName:
    process.env.NVIDIA_PROVIDER_DISPLAY_NAME?.trim() || "NVIDIA NIM",
  nvidiaAspectRatio:
    process.env.NVIDIA_ASPECT_RATIO?.trim() || "match_input_image",
  nvidiaSteps: intEnv("NVIDIA_STEPS", 30),
  nvidiaCfgScale: floatEnv("NVIDIA_CFG_SCALE", 3.5),
  nvidiaSeed: intEnv("NVIDIA_SEED", 0),
  imageHttp429MaxAttempts: intEnv("IMAGE_HTTP_429_MAX_ATTEMPTS", 1),
  /** When false (default), skip hosted NVIDIA trial for custom photos and use Gemini when configured. */
  nvidiaAttemptCustomPhotos:
    process.env.NVIDIA_ATTEMPT_CUSTOM_PHOTOS?.trim().toLowerCase() === "true",
  geminiRateLimitsDocUrl: process.env.GEMINI_RATE_LIMITS_DOC_URL?.trim() ?? "",
  imageProviderKeysHelpUrl:
    process.env.IMAGE_PROVIDER_KEYS_HELP_URL?.trim() ?? "",
} as const;
