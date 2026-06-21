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
  nvidiaQwenSupportsMultiImage,
  saveGeneratedImage,
  tryOnImageToJpegBuffer,
  type NvidiaInferResponse,
  type NvidiaOpenAiEditResponse,
} from "./nvidiaCommon";

async function imageInputsToDataUrls(
  images: TryOnImageInput[],
  apiKey: string,
  labelPrefix: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const jpegBuffer = await tryOnImageToJpegBuffer(images[i]);
    const contentType = "image/jpeg";

    try {
      const assetId = await uploadNvcfImageAsset(
        jpegBuffer,
        contentType,
        apiKey,
        `${labelPrefix}-${i + 1}`
      );
      urls.push(nvcfAssetImageReference(assetId, contentType));
    } catch {
      urls.push(`data:image/jpeg;base64,${jpegBuffer.toString("base64")}`);
    }
  }

  return urls;
}

async function postOpenAiEdits(
  apiKey: string,
  body: Record<string, unknown>
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

  const model = TRY_ON_ENV.nvidiaImageModel.replace(/^\/+|\/+$/g, "");
  const size =
    dims?.width && dims?.height ? `${dims.width}x${dims.height}` : undefined;

  console.log(
    `[TryOn] ${providerLabel} (Qwen): preparing ${editImages.length} image(s), multi=${useMultiImage}`
  );

  const dataUrls = await imageInputsToDataUrls(editImages, apiKey, "vogo-qwen");

  try {
    const openAiBody: Record<string, unknown> = {
      model,
      prompt,
      image: dataUrls.length === 1 ? dataUrls[0] : dataUrls,
      n: 1,
      response_format: "b64_json",
    };
    if (size) openAiBody.size = size;

    const buffer = await postOpenAiEdits(apiKey, openAiBody);
    return saveGeneratedImage(buffer);
  } catch (openAiErr) {
    console.warn(
      `[TryOn] ${providerLabel} (Qwen): OpenAI edits failed, trying /genai infer…`,
      openAiErr instanceof Error ? openAiErr.message : openAiErr
    );
  }

  const inferBody: Record<string, unknown> = {
    prompt,
    image: dataUrls.length === 1 ? dataUrls[0] : dataUrls,
    seed: TRY_ON_ENV.nvidiaSeed,
  };

  const assetIds = dataUrls
    .map((ref) => {
      const m = /asset_id,([a-f0-9-]+)/i.exec(ref);
      return m?.[1] ?? "";
    })
    .filter(Boolean);

  const buffer = await postQwenInfer(apiKey, inferBody, assetIds);
  return saveGeneratedImage(buffer);
}
