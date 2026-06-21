import { TRY_ON_ENV } from "./env";
import { buildNvidiaQwenTryOnPrompt } from "./prompts";
import { nvcfAssetImageReference, uploadNvcfImageAsset } from "./nvidiaAssets";
import type { GenerateTryOnOptions, TryOnImageInput } from "./types";
import {
  buildNvidiaGenAiInferUrl,
  buildNvidiaOpenAiEditsUrl,
  bufferFromNvidiaInferResponse,
  bufferFromOpenAiEditResponse,
  formatNvidiaHttpError,
  normalizeNvidiaQwenOpenAiModelId,
  nvidiaQwenSupportsMultiImage,
  saveGeneratedImage,
  tryOnImageToJpegBuffer,
  type NvidiaInferResponse,
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

async function postOpenAiEdits(
  apiKey: string,
  body: Record<string, unknown>,
  assetIds: string[]
): Promise<Buffer> {
  const providerLabel = TRY_ON_ENV.nvidiaProviderDisplayName;
  const url = buildNvidiaOpenAiEditsUrl();

  console.log(`[TryOn] ${providerLabel} (Qwen Edit): POST`, url, "model:", body.model);

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

  return bufferFromOpenAiEditResponse(json, providerLabel);
}

async function postQwenInfer(
  apiKey: string,
  body: Record<string, unknown>,
  assetIds: string[]
): Promise<Buffer> {
  const providerLabel = TRY_ON_ENV.nvidiaProviderDisplayName;
  const url = buildNvidiaGenAiInferUrl();

  console.log(`[TryOn] ${providerLabel} (Qwen infer): POST`, url);

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
    throw new Error(`${providerLabel} Qwen infer request failed (${reason}).`);
  }

  const text = await res.text();

  if (!res.ok) {
    console.error(`[TryOn] ${providerLabel} (Qwen infer) failed`, res.status, text.slice(0, 500));
    throw new Error(formatNvidiaHttpError(res.status, text));
  }

  let json: NvidiaInferResponse;
  try {
    json = JSON.parse(text) as NvidiaInferResponse;
  } catch {
    throw new Error(`${providerLabel} returned non-JSON response`);
  }

  return bufferFromNvidiaInferResponse(json, providerLabel);
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

  console.log(
    `[TryOn] ${providerLabel} (Qwen): preparing ${editImages.length} image(s), multi=${useMultiImage}`
  );

  const { refs, assetIds } = await uploadImagesAsAssetRefs(editImages, apiKey, "vogo-qwen");

  const openAiBody: Record<string, unknown> = {
    model,
    prompt,
    image: refs.length === 1 ? refs[0] : refs,
    n: 1,
    response_format: "b64_json",
  };
  if (size) openAiBody.size = size;

  try {
    const buffer = await postOpenAiEdits(apiKey, openAiBody, assetIds);
    return saveGeneratedImage(buffer);
  } catch (openAiErr) {
    console.warn(
      `[TryOn] ${providerLabel} (Qwen): OpenAI edits failed, trying /infer…`,
      openAiErr instanceof Error ? openAiErr.message : openAiErr
    );
  }

  const inferBody: Record<string, unknown> = {
    prompt,
    image: refs.length === 1 ? refs[0] : refs,
    seed: TRY_ON_ENV.nvidiaSeed,
  };

  const buffer = await postQwenInfer(apiKey, inferBody, assetIds);
  return saveGeneratedImage(buffer);
}
