import { TRY_ON_ENV } from "./env";
import { buildNvidiaKontextTryOnPrompt } from "./prompts";
import { nvcfAssetImageReference, uploadNvcfImageAsset } from "./nvidiaAssets";
import type { GenerateTryOnOptions } from "./types";
import {
  buildNvidiaGenAiInferUrl,
  bufferFromNvidiaInferResponse,
  formatNvidiaHttpError,
  saveGeneratedImage,
  tryOnImageToJpegBuffer,
  type NvidiaInferResponse,
} from "./nvidiaCommon";

export async function generateWithNvidiaFlux(options: GenerateTryOnOptions) {
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
  const url = buildNvidiaGenAiInferUrl();
  const prompt = options.prompt || buildNvidiaKontextTryOnPrompt({}, dims);

  const jpegBuffer = await tryOnImageToJpegBuffer(personImage);
  const contentType = "image/jpeg";

  console.log(`[TryOn] ${providerLabel} (FLUX Kontext): uploading person image to NVCF assets…`);
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

  console.log(`[TryOn] ${providerLabel} (FLUX Kontext): POST`, url);

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
      signal: AbortSignal.timeout(TRY_ON_ENV.nvidiaRequestTimeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${providerLabel} API request failed (${reason}). Check NVIDIA_API_KEY, network/firewall, and NVIDIA_REQUEST_TIMEOUT_MS (default ${TRY_ON_ENV.nvidiaRequestTimeoutMs}ms).`
    );
  }

  const text = await res.text();

  if (!res.ok) {
    console.error(`[TryOn] ${providerLabel} (FLUX Kontext) failed`, res.status, text.slice(0, 500));
    throw new Error(formatNvidiaHttpError(res.status, text));
  }

  let json: NvidiaInferResponse;
  try {
    json = JSON.parse(text) as NvidiaInferResponse;
  } catch {
    throw new Error(`${providerLabel} returned non-JSON response`);
  }

  const buffer = bufferFromNvidiaInferResponse(json, providerLabel);
  return saveGeneratedImage(buffer);
}
