import { generateWithGemini, geminiMissingConfigMessage, isGeminiConfigured } from "../gemini";
import {
  generateWithNvidia,
  isNvidiaConfigured,
  isNvidiaCustomImageUnsupported,
  nvidiaMissingConfigMessage,
} from "../nvidia";
import { isNvidiaFallbackEligible, isNvidiaQwenModel } from "../nvidiaCommon";
import { TRY_ON_ENV } from "../env";
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

const providers: Record<ImageProviderId, ImageTransformProvider> = {
  gemini: geminiProvider,
  nvidia: nvidiaProvider,
};

export function getActiveImageProviderId(): ImageProviderId {
  const raw = TRY_ON_ENV.imageProvider.trim().toLowerCase();
  if (raw === "nvidia") return "nvidia";
  return "gemini";
}

export function supportedImageProviders(): ImageProviderId[] {
  return Object.keys(providers) as ImageProviderId[];
}

export function getImageTransformProvider(): ImageTransformProvider {
  const id = getActiveImageProviderId();
  const provider = providers[id];
  if (!provider) {
    throw new Error(
      `Unknown IMAGE_PROVIDER "${TRY_ON_ENV.imageProvider}". Supported: ${supportedImageProviders().join(", ")}.`
    );
  }
  return provider;
}

/** True when the active provider (or Gemini fallback for NVIDIA trial) can run. */
export function isTryOnConfigured(): boolean {
  const id = getActiveImageProviderId();
  if (id === "nvidia") {
    return isNvidiaConfigured() || isGeminiConfigured();
  }
  return isGeminiConfigured();
}

export function tryOnMissingConfigMessage(): string {
  const id = getActiveImageProviderId();
  if (id === "nvidia" && !isNvidiaConfigured() && !isGeminiConfigured()) {
    return `${nvidiaMissingConfigMessage()} Or set GEMINI_API_KEY for automatic fallback.`;
  }
  return getImageTransformProvider().missingConfigurationMessage();
}

export async function generateWithActiveProvider(
  options: GenerateTryOnOptions
): Promise<GenerateTryOnResponse> {
  const id = getActiveImageProviderId();
  const provider = providers[id];

  if (!provider) {
    throw new Error(
      `Unknown IMAGE_PROVIDER "${TRY_ON_ENV.imageProvider}". Supported: ${supportedImageProviders().join(", ")}.`
    );
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
        throw new Error(
          "NVIDIA hosted API could not run try-on (404 or unsupported photo format). Set IMAGE_PROVIDER=gemini and add GEMINI_API_KEY, or check NVIDIA_IMAGE_MODEL / NVIDIA_OPENAI_API_BASE_URL in .env.example."
        );
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
      });
    }
    throw err;
  }
}
