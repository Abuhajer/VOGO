import type { ImageDimensions } from "./normalize";
import type { GarmentCoverage } from "./garment-styling";
import type { GarmentTextContext } from "./types";

function formatSize(dims?: ImageDimensions | null): string {
  if (!dims?.width || !dims?.height) {
    return "Output must be the same pixel size as the person photo.";
  }
  return `Output must be exactly ${dims.width}×${dims.height} pixels — same framing, no crop, no borders.`;
}

function formatGarmentReferencePriority(hasGarmentImage: boolean): string {
  if (hasGarmentImage) {
    return `Reference priority (strict order):
1. Garment reference image (first image) — primary source for color, fabric, cut, lapels, buttons, and all visible details.
2. Garment title — product name; use when the image is ambiguous.
3. Garment description — tailoring and styling notes; use for fit and layering only.`;
  }

  return `Reference priority (strict order):
1. Garment title — primary product name.
2. Garment description — tailoring, fabric, and styling details.`;
}

export function buildGarmentTitlePart(title: string): string {
  return `Garment title: ${title.trim()}`;
}

export function buildGarmentDescriptionPart(description: string): string {
  return `Garment description: ${description.trim()}`;
}

function buildClothingChangeRules(coverage?: GarmentCoverage): string {
  if (coverage === "upper") {
    return `- Primary change: replace the person's jacket/blazer, visible shirt, waistcoat, and tie with the reference garment's jacket — the upper-body swap must be obvious.
- The reference product is jacket/outerwear only. Ignore any trousers or legs shown on the mannequin in the reference photo.
- Do not change the person's trousers, legs, lap, or seat — keep them exactly as in the person photo.`;
  }

  return `- Replace the full visible outfit: jacket, waistcoat (if in reference), shirt, tie, and trousers with the reference garment.
- Match trouser color and fabric from the reference — do not leave the person's original jacket or pants visible.
- The outfit change must be clearly visible and photorealistic.`;
}

/** Final instruction block — sent after garment image, title, description, and person photo. */
export function buildMenswearTryOnInstructionPrompt(
  dims?: ImageDimensions | null,
  extraSections?: string,
  coverage?: GarmentCoverage
): string {
  return `${formatGarmentReferencePriority(true)}

Person photo (last image): virtual try-on base. Replace only visible clothing with the garment shown in the first image. Use title and description when they add detail the image does not show.

Task: dress the person in the referenced garment. The outfit change must be obvious and photorealistic.
${formatSize(dims)}
${extraSections ?? ""}

Rules:
- Same person, pose, face, hair, skin, background, and camera framing as the person photo.
- Do not zoom, crop, rotate, or add empty margins.
- When text and image conflict, trust the garment reference image for color and fabric.
- Natural bespoke fit: shoulders, lapels, drape, fabric sheen.
${buildClothingChangeRules(coverage)}`;
}

/** Short prompt for NVIDIA FLUX Kontext (person image only — no garment photo). */
export function buildNvidiaKontextTryOnPrompt(
  garment: GarmentTextContext,
  dims?: ImageDimensions | null,
  extraSections?: string,
  coverage?: GarmentCoverage
): string {
  const title = garment.title?.trim();
  const description = garment.description?.trim();
  const titleLine = title ? buildGarmentTitlePart(title) : null;
  const descLine = description ? buildGarmentDescriptionPart(description) : null;
  const garmentLabel = title || description || "luxury tailored menswear from the VOGO collection";

  return `${formatGarmentReferencePriority(false)}

${titleLine ?? ""}${titleLine && descLine ? "\n" : ""}${descLine ?? ""}

Virtual try-on: replace only the person's clothing with ${garmentLabel}.
${formatSize(dims)}
${extraSections ?? ""}
Keep the same face, hair, pose, background, lighting, and full-body framing. Change clothing only. Realistic fit and drape for menswear.
${buildClothingChangeRules(coverage)}`;
}

/** @deprecated Use buildMenswearTryOnInstructionPrompt with structured multimodal parts. */
export function buildMenswearTryOnPrompt(
  garmentDescription?: string,
  dims?: ImageDimensions | null,
  extraSections?: string
): string {
  const description = garmentDescription?.trim() || null;
  return buildMenswearTryOnInstructionPrompt(dims, extraSections).replace(
    "Replace only visible clothing with the garment shown in the first image. Use title and description when they add detail the image does not show.",
    description
      ? `Replace only visible clothing with: ${description}.`
      : "Replace only visible clothing with the garment shown in the first image."
  );
}
