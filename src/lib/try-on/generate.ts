import {
  getActiveImageProviderId,
  generateWithActiveProvider,
  tryOnMissingConfigMessage,
} from "./providers/registry";
import { assertExactPersonCanvas, getPersonImageDimensions } from "./normalize";
import { buildUnderlayerPromptSection, inferGarmentStyling } from "./garment-styling";
import {
  buildDimensionLockPart,
  buildMenswearTryOnInstructionPrompt,
  buildNvidiaKontextTryOnPrompt,
} from "./prompts";
import { readLocalPublicFileAsync, saveUploadBuffer } from "./storage";
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
  const nvidiaPrompt = buildNvidiaKontextTryOnPrompt(
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

  // Dimension lock → full instructions → person photo → garment reference
  const multimodalParts: TryOnMultimodalPart[] = [
    { type: "text", text: buildDimensionLockPart(personDims) },
    { type: "text", text: instructionPrompt },
    { type: "image", image: personImage },
    { type: "image", image: garmentImage },
  ];

  const geminiImages = [personImage, garmentImage];
  const nvidiaImages = [personImage];

  const result = await generateWithActiveProvider({
    prompt,
    multimodalParts,
    originalImages: providerId === "nvidia" ? nvidiaImages : geminiImages,
    targetDimensions: personDims ?? undefined,
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

  const rawBuffer = await readLocalPublicFileAsync(result.url);
  if (!rawBuffer) {
    throw new Error("Generated image could not be read from storage");
  }

  const { buffer, width, height } = await assertExactPersonCanvas(
    input.personImageUrl,
    rawBuffer
  );

  if (personDims && (width !== personDims.width || height !== personDims.height)) {
    console.warn(
      `[TryOn] Output dimensions ${width}×${height} ≠ person ${personDims.width}×${personDims.height}`
    );
  } else if (personDims) {
    console.log(`[TryOn] Output locked to ${width}×${height} (matches person photo)`);
  }

  const { url: finalUrl } = await saveUploadBuffer(
    buffer,
    `tryon-${Date.now()}`,
    "image/png"
  );

  return {
    url: finalUrl,
    width,
    height,
  };
}

export { isTryOnConfigured, tryOnMissingConfigMessage } from "./providers/registry";
