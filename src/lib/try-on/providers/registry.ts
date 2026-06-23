import {
  comfyMissingConfigMessage,
  generateWithComfy,
  isComfyConfigured,
} from "../comfy";
import { generateWithGemini, geminiMissingConfigMessage, isGeminiConfigured } from "../gemini";
import {
  generateWithNvidia,
  isNvidiaConfigured,
  isNvidiaCustomImageUnsupported,
  nvidiaMissingConfigMessage,
} from "../nvidia";
import { isNvidiaFallbackEligible, isNvidiaQwenModel } from "../nvidiaCommon";
import { TRY_ON_ENV } from "../env";
import { getTryOnImageProvider } from "@/server/try-on-settings";
import type { GenerateTryOnOptions, GenerateTryOnResponse } from "../types";
import type { ImageProviderId, ImageTransformProvider } from "./types";

const geminiProvider: ImageTransformProvider = {
  id: "gemini",
  displayName: TRY_ON_ENV.geminiProviderDisplayName,
  isConfigured: isGeminiConfigured,
  missingConfigurationMessage: geminiMissingConfigMessage,
  generate: generateWithGemini,
};

const nvidiaProvider: ImageTransformProvider = {
  id: "nvidia",
  displayName: TRY_ON_ENV.nvidiaProviderDisplayName,
  isConfigured: isNvidiaConfigured,
  missingConfigurationMessage: nvidiaMissingConfigMessage,
  generate: generateWithNvidia,
};

const localProvider: ImageTransformProvider = {
  id: "local",
  displayName: TRY_ON_ENV.comfyProviderDisplayName,
  isConfigured: isComfyConfigured,
  missingConfigurationMessage: comfyMissingConfigMessage,
  generate: generateWithComfy,
};

const providers: Record<ImageProviderId, ImageTransformProvider> = {
  gemini: geminiProvider,
  nvidia: nvidiaProvider,
  local: localProvider,
};

/** Env-only default — prefer {@link resolveActiveImageProviderId} at runtime. */
export function getActiveImageProviderId(): ImageProviderId {
  const raw = TRY_ON_ENV.imageProvider.trim().toLowerCase();
  if (raw === "nvidia") return "nvidia";
  if (raw === "local" || raw === "comfy") return "local";
  return "gemini";
}

/** Effective provider: admin DB/file setting overrides env (gemini | local only). */
export async function resolveActiveImageProviderId(): Promise<ImageProviderId> {
  const adminChoice = await getTryOnImageProvider();
  if (adminChoice === "local") return "local";
  return "gemini";
}

export function supportedImageProviders(): ImageProviderId[] {
  return Object.keys(providers) as ImageProviderId[];
}

export function getImageTransformProvider(id = getActiveImageProviderId()): ImageTransformProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(
      `Unknown IMAGE_PROVIDER "${TRY_ON_ENV.imageProvider}". Supported: ${supportedImageProviders().join(", ")}.`
    );
  }
  return provider;
}

/** True when the active provider (or Gemini fallback for NVIDIA trial) can run. */
export async function isTryOnConfigured(): Promise<boolean> {
  const id = await resolveActiveImageProviderId();
  if (id === "local") {
    return isComfyConfigured();
  }
  if (id === "nvidia") {
    return isNvidiaConfigured() || isGeminiConfigured();
  }
  return isGeminiConfigured();
}

export async function tryOnMissingConfigMessage(): Promise<string> {
  const id = await resolveActiveImageProviderId();
  if (id === "local") {
    return localProvider.missingConfigurationMessage();
  }
  if (id === "nvidia" && !isNvidiaConfigured() && !isGeminiConfigured()) {
    return `${nvidiaMissingConfigMessage()} Or set GEMINI_API_KEY for automatic fallback.`;
  }
  return getImageTransformProvider(id).missingConfigurationMessage();
}

export async function generateWithActiveProvider(
  options: GenerateTryOnOptions
): Promise<GenerateTryOnResponse> {
  const id = await resolveActiveImageProviderId();
  const provider = providers[id];

  if (!provider) {
    throw new Error(
      `Unknown IMAGE_PROVIDER "${TRY_ON_ENV.imageProvider}". Supported: ${supportedImageProviders().join(", ")}.`
    );
  }

  if (id === "local") {
    if (!provider.isConfigured()) {
      throw new Error(provider.missingConfigurationMessage());
    }
    return localProvider.generate(options);
  }

  if (id === "nvidia" && isGeminiConfigured() && !TRY_ON_ENV.nvidiaAttemptCustomPhotos) {
    const backend = isNvidiaQwenModel() ? "Qwen Image Edit" : "FLUX Kontext";
    console.warn(
      `[TryOn] Using Gemini for custom photo try-on (hosted NVIDIA ${backend} may reject uploads — set NVIDIA_ATTEMPT_CUSTOM_PHOTOS=true to try NVIDIA first)`
    );
    return geminiProvider.generate({
      prompt: options.fallbackPrompt ?? options.prompt,
      originalImages: options.fallbackImages ?? options.originalImages,
      multimodalParts: options.fallbackMultimodalParts ?? options.multimodalParts,
      targetDimensions: options.targetDimensions,
      onProgress: options.onProgress,
    });
  }

  if (id === "nvidia" && !isNvidiaConfigured() && isGeminiConfigured()) {
    console.warn("[TryOn] NVIDIA_API_KEY missing — using Gemini");
    return geminiProvider.generate(options);
  }

  if (!provider.isConfigured()) {
    throw new Error(provider.missingConfigurationMessage());
  }

  if (id !== "nvidia") {
    return provider.generate(options);
  }

  try {
    return await nvidiaProvider.generate(options);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isNvidiaFallbackEligible(message)) {
      if (!isGeminiConfigured()) {
        if (isNvidiaCustomImageUnsupported(message)) {
          throw new Error(
            "NVIDIA free API does not accept custom photos (demo images only). Set IMAGE_PROVIDER=gemini and add GEMINI_API_KEY, or use a self-hosted NIM deployment."
          );
        }
        throw err;
      }
      console.warn(
        "[TryOn] NVIDIA request failed — falling back to Gemini for try-on:",
        message.slice(0, 120)
      );
      return geminiProvider.generate({
        ...options,
        prompt: options.fallbackPrompt ?? options.prompt,
        originalImages: options.fallbackImages ?? options.originalImages,
        multimodalParts: options.fallbackMultimodalParts ?? options.multimodalParts,
        onProgress: options.onProgress,
      });
    }
    throw err;
  }
}
