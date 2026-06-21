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
5. DO NOT MOVE THE PERSON: same position left/right/up/down in the frame — no recentre or reframing.
6. CLOTHING ONLY: replace visible garments — NOT a portrait edit, relight, or background change.
7. IN-PLACE EDIT: treat the person photo as a fixed template; paint the new outfit onto the existing body at the same scale and position.
8. NEVER output a square canvas (e.g. 1024×1024) when the person photo is portrait or landscape — match input pixel dimensions exactly.`;
}

const CLOTHING_ONLY_LOCK = `
=== CLOTHING-ONLY EDIT (STRICT — ZERO TOLERANCE) ===
- Change ONLY garment/clothing pixels. Every other pixel must stay identical to the person photo.
- Face (eyes, nose, mouth, lips, ears, eyebrows, expression) — preserve exactly; no edits, smoothing, or replacement.
- Hair, beard, skin tone, neck skin, hands, fingers — preserve exactly.
- Body shape, pose, posture, limb angles, head position — preserve exactly.
- Background, walls, floor, furniture, environment — preserve exactly; no replacement, blur, cleanup, or extension.
- Lighting, shadows, exposure, white balance — preserve exactly.
- NO beautification, NO retouching, NO skin smoothing, NO teeth whitening, NO makeup changes, NO portrait enhancement.
- NO environment change, NO scene relight, NO HDR, NO background whitening.
- Swap only the catalog product garment onto the person — nothing else.`;

const LOCK_BODY_POSE = `
=== BODY / POSE / POSITION LOCK ===
- Person stays in the EXACT same spot in the frame — do not shift, recentre, or reposition.
- Standing or seated posture, limb angles, and body proportions — UNCHANGED.
- Head size relative to the frame — UNCHANGED (no zoom-in portrait effect).
- Visible skin on face, neck, and hands — UNCHANGED except where new garment fabric naturally covers it.
- Background, furniture, and scene geometry — UNCHANGED.`;

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

const FORBIDDEN_EDITS = `
=== FORBIDDEN (UNLESS CHANGING CLOTHING) ===
- Zoom in or zoom out (subject closer/farther, or larger/smaller in frame)
- Moving, shifting, or recentring the person in the frame
- Crop, reframe, or change subject scale in the frame
- Rotate, flip, mirror, or tilt
- Face, hair, skin, hands, pose, or body proportion edits
- Background replacement, whitening, relighting, environment change, or HDR beautify
- Portrait retouching, skin smoothing, teeth whitening, makeup, or beautification
- Letterboxing, pillarboxing, black bars, or empty margins inside the scene
- Changing output resolution or aspect ratio away from the person photo`;

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
    return `=== GARMENT COVERAGE (UPPER BODY / OUTERWEAR ONLY) ===
- Replace ONLY the jacket/blazer and visible shirt or tie on the upper body with the catalog product.
- The reference may show trousers on a mannequin — IGNORE those legs; use only the jacket details.
- Keep the person's existing trousers and pants below the waist exactly as in the person photo.
- Add an appropriate dress shirt under the jacket if the reference is outerwear only.
- Do NOT alter face, hair, skin, hands, pose, background, or lower-body clothing.`;
  }

  return `=== GARMENT COVERAGE (FULL OUTFIT) ===
- Replace the full visible outfit: jacket, waistcoat (if in reference), shirt, tie, and trousers with the catalog product.
- Match trouser color and fabric from the reference — do not leave original jacket or pants visible.
- For seated poses, drape trousers naturally over the lap with realistic folds — no melted fabric or distorted crotch.
- Do NOT alter face, hair, skin, hands, pose, or background.`;
}

function buildImageOrderNote(hasGarmentImage: boolean): string {
  if (!hasGarmentImage) {
    return "Image order: person photo only.";
  }
  return `Image order (after this text):
1. Person photo — the master canvas. Copy its width, height, framing, pose, face, hair, skin, hands, and background EXACTLY. Edit ONLY the clothing on this person.
2. Garment reference — use ONLY for garment color, fabric, cut, lapels, buttons, and tailoring. Do NOT copy its background, mannequin, or crop.`;
}

function buildVerificationBlock(dims?: ImageDimensions | null): string {
  return `=== VERIFICATION ===
✓ Output is exactly ${dims?.width ?? "?"}×${dims?.height ?? "?"} pixels with NO zoom or crop
✓ Person is in the SAME position and scale as the person photo (not moved, not closer)
✓ ONLY clothing changed to catalog product — face, hair, skin, hands, pose, background IDENTICAL
✓ Face and hair IDENTICAL to person photo (no gray blocks, blur, or retouching)
✓ Pose, background, lighting, and framing IDENTICAL to person photo
✓ No beautification, environment change, or portrait edits`;
}

/** Short leading instruction: clothing-only lock (sent before person photo). */
export function buildClothingOnlyLockPart(): string {
  return "CLOTHING-ONLY: Change ONLY the garment to the catalog product. Preserve face, hair, skin, hands, pose, background, and lighting EXACTLY. No beautification, retouching, or environment edits.";
}

/** Short leading instruction sent before the person photo in the multimodal payload. */
export function buildDimensionLockPart(dims?: ImageDimensions | null): string {
  if (!dims?.width || !dims?.height) {
    return "Output MUST match the person photo pixel width × height exactly. Change clothing ONLY. NO zoom, crop, reframe, face, background, or body edits.";
  }
  return `OUTPUT LOCK: The next image is the person photo at ${dims.width}×${dims.height} pixels. Your output MUST be that same canvas with ONLY the clothing changed to the catalog product. FORBIDDEN: zoom, crop, reframe, rotate, relight, background edits, face/body/pose/skin/hair edits, beautification, retouching, environment change.`;
}

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

${CLOTHING_ONLY_LOCK}

${buildImageOrderNote(true)}
${garmentBlock}
=== TRANSFORMATION OBJECTIVE ===
Primary task ONLY: replace visible clothing with the catalog product garment. Edit garment pixels only — nothing else.
${formatSize(dims)}
${extraSections ?? ""}
${buildCoverageBlock(coverage)}
${FORBIDDEN_EDITS}

=== ABSOLUTE PRESERVATION (EVERYTHING EXCEPT CLOTHING) ===
- Same person, pose, position, face, hair, skin, hands, background, lighting, and camera framing as the person photo.
- Face shape, eyes, nose, mouth, ears, skin tone, expression — UNCHANGED.
- Body proportions, posture, and placement in the frame — UNCHANGED.
- When text and garment image conflict, trust the garment reference for color and fabric only.
${LOCK_BODY_POSE}
${LOCK_OUTPUT_GEOMETRY}
${LOCK_LIGHTING_AND_SCENE}
${LOCK_FACE_HEAD}
${CLOTHING_LIGHT_MATCH}

${buildVerificationBlock(dims)}`;
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

  return `${garmentBlock}Virtual try-on: replace ONLY the person's clothing with the catalog product (${garmentLabel}). Change garment pixels only.
${buildCriticalConstraints(dims)}
${CLOTHING_ONLY_LOCK}
${formatSize(dims)}
${extraSections ?? ""}
${buildCoverageBlock(coverage)}
${FORBIDDEN_EDITS}
Preserve face, hair, skin, hands, pose, position, background, lighting, and full-body framing exactly. Do NOT zoom, crop, or move the person. No beautification or retouching.
${LOCK_BODY_POSE}
${LOCK_OUTPUT_GEOMETRY}
${LOCK_LIGHTING_AND_SCENE}
${LOCK_FACE_HEAD}
${CLOTHING_LIGHT_MATCH}
${buildVerificationBlock(dims)}`;
}

/** Qwen Image Edit — supports optional garment reference as a second image (2511/2509). */
export function buildNvidiaQwenTryOnPrompt(
  garment: GarmentTextContext,
  dims?: ImageDimensions | null,
  extraSections?: string,
  coverage?: GarmentCoverage,
  garmentImageIncluded = false
): string {
  const garmentBlock = buildGarmentContextBlock(garment);
  const garmentLabel =
    garment.title?.trim() ||
    garment.description?.trim() ||
    "luxury tailored menswear from the VOGO collection";

  const imageGuide = garmentImageIncluded
    ? `Image 1 is the person photo — preserve face, hair, skin, hands, pose, background, and lighting exactly; edit clothing only. Image 2 is the catalog garment reference — match its color, cut, lapels, and fabric on the person only; ignore mannequin and background.
`
    : `Image 1 is the person photo — preserve face, hair, skin, hands, pose, background, and lighting exactly; edit clothing only.
`;

  return `${garmentBlock}${imageGuide}Virtual try-on: replace ONLY the person's clothing with the catalog product (${garmentLabel}). Change garment pixels only.
${buildCriticalConstraints(dims)}
${CLOTHING_ONLY_LOCK}
${formatSize(dims)}
${extraSections ?? ""}
${buildCoverageBlock(coverage)}
${FORBIDDEN_EDITS}
Preserve face, hair, skin, hands, pose, position, background, lighting, and full-body framing exactly. Do NOT zoom, crop, reframe, or move the person. No beautification, retouching, or environment change.
${LOCK_BODY_POSE}
${LOCK_OUTPUT_GEOMETRY}
${LOCK_LIGHTING_AND_SCENE}
${LOCK_FACE_HEAD}
${CLOTHING_LIGHT_MATCH}
${buildVerificationBlock(dims)}`;
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
