import {
  getActiveImageProviderId,
  generateWithActiveProvider,
  tryOnMissingConfigMessage,
} from "./providers/registry";
import { getPersonImageDimensions, lockOutputToPersonDimensions, readImageBufferFromRef } from "./normalize";
import { getSharp } from "./sharpLazy";
import { buildUnderlayerPromptSection, inferGarmentStyling } from "./garment-styling";
import {
  buildClothingOnlyLockPart,
  buildDimensionLockPart,
  buildMenswearTryOnInstructionPrompt,
  buildNvidiaKontextTryOnPrompt,
  buildNvidiaQwenTryOnPrompt,
} from "./prompts";
import { saveUploadBuffer } from "./storage";
import { TRY_ON_ENV } from "./env";
import { isNvidiaQwenModel, nvidiaQwenSupportsMultiImage } from "./nvidiaCommon";
import type { GenerateTryOnResponse, TryOnMultimodalPart } from "./types";

export type RunTryOnInput = {
  personImageUrl: string;
  garmentImageUrl: string;
  /** Legacy single-line override — used as description when productDescEn is absent. */
  garmentDescription?: string;
  productSlug?: string | null;
  productNameEn?: string | null;
  productDescEn?: string | null;
};

export async function runVirtualTryOn(input: RunTryOnInput): Promise<GenerateTryOnResponse> {
  const providerId = getActiveImageProviderId();
  const personDims = await getPersonImageDimensions(input.personImageUrl);

  if (!personDims?.width || !personDims?.height) {
    throw new Error("Could not read person photo dimensions — upload a valid portrait image");
  }

  console.log(`[TryOn] Person canvas ${personDims.width}×${personDims.height}`);

  const garmentTitle = input.productNameEn?.trim() || null;
  const garmentDescriptionText =
    input.productDescEn?.trim() || input.garmentDescription?.trim() || null;

  const styling = inferGarmentStyling(
    garmentTitle ?? garmentDescriptionText ?? "",
    garmentDescriptionText,
    input.productSlug
  );
  const promptSections = buildUnderlayerPromptSection(styling);

  const garmentContext = {
    title: garmentTitle,
    description: garmentDescriptionText,
  };

  const instructionPrompt = buildMenswearTryOnInstructionPrompt(
    garmentContext,
    personDims,
    promptSections,
    styling.coverage
  );
  const useNvidiaQwen = providerId === "nvidia" && isNvidiaQwenModel();
  const nvidiaPrompt = useNvidiaQwen
    ? buildNvidiaQwenTryOnPrompt(
        garmentContext,
        personDims,
        promptSections,
        styling.coverage,
        TRY_ON_ENV.nvidiaQwenUseGarmentImage && nvidiaQwenSupportsMultiImage()
      )
    : buildNvidiaKontextTryOnPrompt(
        garmentContext,
        personDims,
        promptSections,
        styling.coverage
      );
  const prompt = providerId === "nvidia" ? nvidiaPrompt : instructionPrompt;

  const garmentImage = {
    url: input.garmentImageUrl,
    mimeType: "image/jpeg" as const,
  };
  const personImage = {
    url: input.personImageUrl,
    mimeType: "image/jpeg" as const,
  };

  // Clothing-only lock → dimension lock → full instructions → person photo → garment reference
  const multimodalParts: TryOnMultimodalPart[] = [
    { type: "text", text: buildClothingOnlyLockPart() },
    { type: "text", text: buildDimensionLockPart(personDims) },
    { type: "text", text: instructionPrompt },
    { type: "image", image: personImage },
    { type: "image", image: garmentImage },
  ];

  const geminiImages = [personImage, garmentImage];
  const nvidiaImages =
    useNvidiaQwen &&
    TRY_ON_ENV.nvidiaQwenUseGarmentImage &&
    nvidiaQwenSupportsMultiImage()
      ? [personImage, garmentImage]
      : [personImage];

  const result = await generateWithActiveProvider({
    prompt,
    multimodalParts,
    originalImages: providerId === "nvidia" ? nvidiaImages : geminiImages,
    targetDimensions: personDims,
    fallbackPrompt: instructionPrompt,
    fallbackImages: geminiImages,
    fallbackMultimodalParts: multimodalParts,
  }).catch((err) => {
    if (err instanceof Error && err.message.includes("not configured")) {
      throw new Error(tryOnMissingConfigMessage());
    }
    throw err;
  });

  if (!result.url) {
    throw new Error("AI generation failed to return a valid image URL");
  }

  const rawBuffer = await readImageBufferFromRef(result.url);

  const {
    buffer,
    width,
    height,
    personWidth,
    personHeight,
  } = await lockOutputToPersonDimensions(input.personImageUrl, rawBuffer);

  if (width !== personDims.width || height !== personDims.height) {
    throw new Error(
      `[TryOn] Output ${width}×${height} ≠ person ${personDims.width}×${personDims.height}`
    );
  }

  const sharp = await getSharp();
  const jpegBuffer = await sharp(buffer).jpeg({ quality: 88, mozjpeg: true }).toBuffer();

  const { url: finalUrl } = await saveUploadBuffer(
    jpegBuffer,
    `tryon-${Date.now()}`,
    "image/jpeg"
  );

  return {
    url: finalUrl,
    width,
    height,
    personWidth,
    personHeight,
  };
}

export { isTryOnConfigured, tryOnMissingConfigMessage } from "./providers/registry";
