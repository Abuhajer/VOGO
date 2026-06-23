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
  /** Qwen Image Edit OpenAI-compatible API (not ai.api.nvidia.com). */
  nvidiaOpenAiApiBaseUrl:
    process.env.NVIDIA_OPENAI_API_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1",
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
  /** Qwen Image Edit: pass garment photo as second reference image when model supports it (2509/2511). */
  nvidiaQwenUseGarmentImage:
    process.env.NVIDIA_QWEN_USE_GARMENT_IMAGE?.trim().toLowerCase() !== "false",
  geminiRateLimitsDocUrl: process.env.GEMINI_RATE_LIMITS_DOC_URL?.trim() ?? "",
  imageProviderKeysHelpUrl:
    process.env.IMAGE_PROVIDER_KEYS_HELP_URL?.trim() ?? "",
  comfyBaseUrl:
    process.env.COMFYUI_BASE_URL?.trim() || "http://127.0.0.1:8188",
  comfyRequestTimeoutMs: intEnv("COMFYUI_REQUEST_TIMEOUT_MS", 180_000),
  comfyMegapixels: floatEnv("COMFYUI_MEGAPIXELS", 0.5),
  comfyCfg: floatEnv("COMFYUI_CFG", 1.0),
  comfySteps: intEnv("COMFYUI_STEPS", 6),
  comfyProviderDisplayName:
    process.env.COMFYUI_PROVIDER_DISPLAY_NAME?.trim() || "Local FLUX Klein",
} as const;
