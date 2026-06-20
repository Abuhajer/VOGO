import sharp from "sharp";
import {
  getActiveImageProviderId,
  generateWithActiveProvider,
  tryOnMissingConfigMessage,
} from "./providers/registry";
import { enforceExactPersonDimensions, getPersonImageDimensions } from "./normalize";
import { buildUnderlayerPromptSection, inferGarmentStyling } from "./garment-styling";
import {
  buildGarmentDescriptionPart,
  buildGarmentTitlePart,
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

  const multimodalParts: TryOnMultimodalPart[] = [
    { type: "image", image: garmentImage },
  ];
  if (garmentTitle) {
    multimodalParts.push({ type: "text", text: buildGarmentTitlePart(garmentTitle) });
  }
  if (garmentDescriptionText) {
    multimodalParts.push({
      type: "text",
      text: buildGarmentDescriptionPart(garmentDescriptionText),
    });
  }
  multimodalParts.push({ type: "image", image: personImage });
  multimodalParts.push({ type: "text", text: instructionPrompt });

  const geminiImages = [garmentImage, personImage];
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

  const buffer = await enforceExactPersonDimensions(input.personImageUrl, rawBuffer);

  const meta = await sharp(buffer).metadata();
  const targetW = personDims?.width ?? meta.width ?? 0;
  const targetH = personDims?.height ?? meta.height ?? 0;

  if (personDims && (meta.width !== targetW || meta.height !== targetH)) {
    console.warn(
      `[TryOn] Output dimensions ${meta.width}×${meta.height} ≠ target ${targetW}×${targetH} after enforce`
    );
  }

  const { url: finalUrl } = await saveUploadBuffer(
    buffer,
    `tryon-${Date.now()}`,
    "image/png"
  );

  return {
    url: finalUrl,
    width: meta.width ?? targetW,
    height: meta.height ?? targetH,
  };
}

export { isTryOnConfigured, tryOnMissingConfigMessage } from "./providers/registry";
