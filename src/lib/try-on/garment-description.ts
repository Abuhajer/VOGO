import { buildUnderlayerPromptSection, inferGarmentStyling } from "./garment-styling";

/** Legacy single-line garment text (title + description). Prefer structured fields in generate.ts. */
export function buildGarmentDescription(
  nameEn: string,
  descEn?: string | null,
  slug?: string | null
): string {
  const name = nameEn.trim();
  const desc = descEn?.trim();

  let base: string;
  if (desc) {
    base = name ? `${name}. ${desc}` : desc;
  } else {
    base = name;
  }

  const styling = inferGarmentStyling(nameEn, descEn, slug);
  if (styling.needsUnderlayer && styling.underlayerText) {
    base += `. Outerwear piece — style with ${styling.underlayerText} visible at collar and chest.`;
  }

  return base;
}

export { buildUnderlayerPromptSection, inferGarmentStyling };
