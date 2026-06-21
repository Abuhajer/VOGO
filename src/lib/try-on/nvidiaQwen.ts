import { TRY_ON_ENV } from "./env";
import { buildNvidiaQwenTryOnPrompt } from "./prompts";
import { nvcfAssetImageReference, uploadNvcfImageAsset } from "./nvidiaAssets";
import type { GenerateTryOnOptions, TryOnImageInput } from "./types";
import {
  buildNvidiaOpenAiEditsUrl,
  bufferFromOpenAiEditResponse,
  formatNvidiaHttpError,
  normalizeNvidiaQwenOpenAiModelId,
  nvidiaQwenSupportsMultiImage,
  saveGeneratedImage,
  tryOnImageToJpegBuffer,
  type NvidiaOpenAiEditResponse,
} from "./nvidiaCommon";

async function uploadImagesAsAssetRefs(
  images: TryOnImageInput[],
  apiKey: string,
  labelPrefix: string
): Promise<{ refs: string[]; assetIds: string[] }> {
  const refs: string[] = [];
  const assetIds: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const jpegBuffer = await tryOnImageToJpegBuffer(images[i]);
    const contentType = "image/jpeg";
    const assetId = await uploadNvcfImageAsset(
      jpegBuffer,
      contentType,
      apiKey,
      `${labelPrefix}-${i + 1}`
    );
    assetIds.push(assetId);
    refs.push(nvcfAssetImageReference(assetId, contentType));
  }

  return { refs, assetIds };
}

export async function generateWithNvidiaQwen(options: GenerateTryOnOptions) {
  const apiKey = TRY_ON_ENV.nvidiaApiKey;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  const images = options.originalImages ?? [];
  const personImage = images[0];
  if (!personImage) {
    throw new Error("NVIDIA Qwen Image Edit requires a person image");
  }

  const useMultiImage =
    TRY_ON_ENV.nvidiaQwenUseGarmentImage &&
    nvidiaQwenSupportsMultiImage() &&
    images.length > 1;

  const editImages = useMultiImage ? images.slice(0, 3) : [personImage];
  const dims = options.targetDimensions;
  const providerLabel = TRY_ON_ENV.nvidiaProviderDisplayName;
  const prompt =
    options.prompt ||
    buildNvidiaQwenTryOnPrompt({}, dims, undefined, undefined, useMultiImage);

  const model = normalizeNvidiaQwenOpenAiModelId();
  const size =
    dims?.width && dims?.height ? `${dims.width}x${dims.height}` : undefined;
  const url = buildNvidiaOpenAiEditsUrl();

  console.log(
    `[TryOn] ${providerLabel} (Qwen): preparing ${editImages.length} image(s), multi=${useMultiImage}`
  );
  console.log(`[TryOn] ${providerLabel} (Qwen Edit): POST`, url, "model:", model);

  const { refs, assetIds } = await uploadImagesAsAssetRefs(editImages, apiKey, "vogo-qwen");

  const body: Record<string, unknown> = {
    model,
    prompt,
    image: refs.length === 1 ? refs[0] : refs,
    n: 1,
    response_format: "b64_json",
  };
  if (size) body.size = size;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(assetIds.length > 0
          ? { "NVCF-INPUT-ASSET-REFERENCES": assetIds.join(",") }
          : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TRY_ON_ENV.nvidiaRequestTimeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`${providerLabel} Qwen edit request failed (${reason}).`);
  }

  const text = await res.text();

  if (!res.ok) {
    console.error(`[TryOn] ${providerLabel} (Qwen Edit) failed`, res.status, text.slice(0, 500));
    throw new Error(formatNvidiaHttpError(res.status, text));
  }

  let json: NvidiaOpenAiEditResponse;
  try {
    json = JSON.parse(text) as NvidiaOpenAiEditResponse;
  } catch {
    throw new Error(`${providerLabel} returned non-JSON response`);
  }

  const buffer = bufferFromOpenAiEditResponse(json, providerLabel);
  return saveGeneratedImage(buffer);
}
