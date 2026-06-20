import type { ImageDimensions } from "./normalize";
import type { GarmentCoverage } from "./garment-styling";
import type { GarmentTextContext } from "./types";

function buildCriticalConstraints(dims?: ImageDimensions | null): string {
  const sizeLine =
    dims?.width && dims?.height
      ? `EXACT ${dims.width} × ${dims.height} pixels — identical to the person photo.`
      : "EXACT same width × height in pixels as the person photo.";

  return `⚠️ CRITICAL CONSTRAINTS — MAXIMUM PRIORITY ⚠️
1. OUTPUT DIMENSIONS: ${sizeLine}
2. OUTPUT ASPECT RATIO: Same ratio as the person photo (portrait stays portrait).
3. NO ZOOM IN: subject must NOT appear closer or larger in frame — match head/body size vs canvas to the person photo within ~2%.
4. NO ZOOM OUT, NO CROP, NO REFRAME, NO ROTATION.
5. CLOTHING ONLY: replace visible garments — NOT a portrait edit, relight, or background change.`;
}

const LOCK_OUTPUT_GEOMETRY = `
=== CAMERA & GEOMETRY LOCK ===
- Same field of view, camera distance, and subject scale as the person photo.
- Subject occupies the SAME percentage of the frame as in the person photo.
- Background shows the SAME amount of space as in the person photo.
- NO recentring: do not shift the person left/right/up/down in the frame.
- NO letterboxing, pillarboxing, black bars, or empty margins drawn inside the scene.`;

const LOCK_LIGHTING_AND_SCENE = `
=== LIGHTING & SCENE LOCK ===
- Preserve exposure, brightness, contrast, and white balance from the person photo.
- Background color and texture must match the person photo — no whitening or relighting.`;

const LOCK_FACE_HEAD = `
=== FACE / HEAD / SKIN LOCK (ZERO TOLERANCE) ===
- Face, hair, beard, ears, neck skin, expression — pixel-identical to the person photo.
- NEVER mask, blur, pixelate, gray-out, or censor the face or head.
- NEVER replace or inpaint the face — clothing swap only.
- Hands and fingers stay natural; do not merge or melt fingers together.`;

const CLOTHING_LIGHT_MATCH = `
=== CLOTHING / LIGHT ===
- New garment uses the SAME scene lighting as the person photo (direction, softness, shadow color).
- Realistic fabric drape, wrinkles, and folds for the person's pose (standing or seated).`;

function formatSize(dims?: ImageDimensions | null): string {
  if (!dims?.width || !dims?.height) {
    return "Render at the identical pixel resolution as the person photo.";
  }
  return `Render at exactly ${dims.width}×${dims.height} pixels — every pixel of canvas matches the person photo.`;
}

function buildGarmentContextBlock(garment: GarmentTextContext): string {
  const title = garment.title?.trim();
  const description = garment.description?.trim();
  const lines: string[] = [];
  if (title) lines.push(`Garment title: ${title}`);
  if (description) lines.push(`Garment description: ${description}`);
  return lines.length ? `${lines.join("\n")}\n` : "";
}

function buildCoverageBlock(coverage?: GarmentCoverage): string {
  if (coverage === "upper") {
    return `=== GARMENT COVERAGE (JACKET / OUTERWEAR ONLY) ===
- Replace the jacket/blazer and visible shirt or tie on the upper body.
- The reference may show trousers on a mannequin — IGNORE those legs; use only the jacket details.
- Keep the person's existing trousers and pants below the waist exactly as in the person photo.
- Add an appropriate dress shirt under the jacket if the reference is outerwear only.`;
  }

  return `=== GARMENT COVERAGE (FULL OUTFIT) ===
- Replace the full visible outfit: jacket, waistcoat (if in reference), shirt, tie, and trousers.
- Match trouser color and fabric from the reference — do not leave original jacket or pants visible.
- For seated poses, drape trousers naturally over the lap with realistic folds — no melted fabric or distorted crotch.`;
}

function buildImageOrderNote(hasGarmentImage: boolean): string {
  if (!hasGarmentImage) {
    return "Image order: person photo only.";
  }
  return `Image order (after this text):
1. Person photo — the master canvas. Copy its width, height, framing, pose, face, hair, skin, hands, and background EXACTLY. Edit ONLY the clothing on this person.
2. Garment reference — use ONLY for garment color, fabric, cut, lapels, buttons, and tailoring. Do NOT copy its background, mannequin, or crop.`;
}

/** Short leading instruction sent before the person photo in the multimodal payload. */
export function buildDimensionLockPart(dims?: ImageDimensions | null): string {
  if (!dims?.width || !dims?.height) {
    return "Output MUST match the person photo pixel width × height exactly. Change clothing ONLY. NO zoom, crop, reframe, or face edits.";
  }
  return `OUTPUT LOCK: Render exactly ${dims.width}×${dims.height} pixels — identical canvas to the next image (person photo). Change ONLY clothing/garments. FORBIDDEN: zoom in, zoom out, crop, reframe, rotate, relight, background change, face or body edits.`;
}

const FORBIDDEN_EDITS = `
=== FORBIDDEN (UNLESS CHANGING CLOTHING) ===
- Zoom in or zoom out (subject closer/farther in frame)
- Crop, reframe, recentre, or change subject scale in the frame
- Rotate, flip, mirror, or tilt
- Face, hair, skin, hands, pose, or body proportion edits
- Background replacement, whitening, relighting, or HDR beautify
- Letterboxing, pillarboxing, black bars, or empty margins inside the scene`;

/** Main try-on instruction — matches Cloth Change Platform flow (person image before garment). */
export function buildMenswearTryOnInstructionPrompt(
  garment: GarmentTextContext,
  dims?: ImageDimensions | null,
  extraSections?: string,
  coverage?: GarmentCoverage
): string {
  const garmentBlock = buildGarmentContextBlock(garment);

  return `You are a professional virtual try-on AI for luxury menswear.

${buildCriticalConstraints(dims)}

${buildImageOrderNote(true)}
${garmentBlock}
=== TRANSFORMATION OBJECTIVE ===
Primary task ONLY: replace visible clothing with the reference garment. Edit garment pixels only.
${formatSize(dims)}
${extraSections ?? ""}
${buildCoverageBlock(coverage)}
${FORBIDDEN_EDITS}

=== ABSOLUTE PRESERVATION (EVERYTHING EXCEPT CLOTHING) ===
- Same person, pose, face, hair, skin, hands, background, lighting, and camera framing as the person photo.
- Face shape, eyes, nose, mouth, ears, skin tone, expression — UNCHANGED.
- Body proportions and pose — UNCHANGED.
- When text and garment image conflict, trust the garment reference for color and fabric only.
${LOCK_OUTPUT_GEOMETRY}
${LOCK_LIGHTING_AND_SCENE}
${LOCK_FACE_HEAD}
${CLOTHING_LIGHT_MATCH}

=== VERIFICATION ===
✓ Output is exactly ${dims?.width ?? "?"}×${dims?.height ?? "?"} pixels with NO zoom or crop
✓ Clothing changed to reference garment with natural fit
✓ Face and hair IDENTICAL to person photo (no gray blocks or blur)
✓ Pose, scale, and framing IDENTICAL to person photo`;
}

export function buildGarmentTitlePart(title: string): string {
  return `Garment title: ${title.trim()}`;
}

export function buildGarmentDescriptionPart(description: string): string {
  return `Garment description: ${description.trim()}`;
}

/** Short prompt for NVIDIA FLUX Kontext (person image only — no garment photo). */
export function buildNvidiaKontextTryOnPrompt(
  garment: GarmentTextContext,
  dims?: ImageDimensions | null,
  extraSections?: string,
  coverage?: GarmentCoverage
): string {
  const garmentBlock = buildGarmentContextBlock(garment);
  const garmentLabel =
    garment.title?.trim() ||
    garment.description?.trim() ||
    "luxury tailored menswear from the VOGO collection";

  return `${garmentBlock}Virtual try-on: replace only the person's clothing with ${garmentLabel}.
${formatSize(dims)}
${extraSections ?? ""}
${buildCoverageBlock(coverage)}
Keep the same face, hair, pose, background, lighting, and full-body framing. Change clothing only.
${LOCK_FACE_HEAD}
${CLOTHING_LIGHT_MATCH}`;
}

/** @deprecated Use buildMenswearTryOnInstructionPrompt with structured multimodal parts. */
export function buildMenswearTryOnPrompt(
  garmentDescription?: string,
  dims?: ImageDimensions | null,
  extraSections?: string
): string {
  return buildMenswearTryOnInstructionPrompt(
    { title: null, description: garmentDescription ?? null },
    dims,
    extraSections
  );
}
