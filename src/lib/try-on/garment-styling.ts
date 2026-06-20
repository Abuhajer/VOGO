export type GarmentCoverage = "upper" | "full";

export type GarmentStyling = {
  needsUnderlayer: boolean;
  underlayerText: string | null;
  /** upper = jacket/blazer only; full = suit/tuxedo with trousers */
  coverage: GarmentCoverage;
};

const FULL_ENSEMBLE =
  /\b(tuxedo|three-piece|two-piece|full suit|groom suit|wedding suit|morning suit)\b/i;

const TOP_OUTERWEAR =
  /\b(blazer|sport coat|smoking jacket|dinner jacket|resort jacket|summer jacket|velvet jacket|evening jacket)\b/i;

const SHIRT_ALREADY_MENTIONED =
  /\b(dress shirt|with shirt|white shirt|shirt and|shirt included|crisp shirt|collar and cuff)\b/i;

/** Slug patterns for VOGO catalog — slug wins over free-text heuristics. */
const BLAZER_SLUGS =
  /(?:^|-)(?:burgundy-velvet-blazer|ivory-linen-blazer|(?:^|-)blazer(?:-|$))/i;

export function inferGarmentCoverage(
  haystack: string,
  slug?: string | null
): GarmentCoverage {
  const slugNorm = slug?.trim().toLowerCase() ?? "";

  if (slugNorm) {
    if (/tuxedo|double-breasted|three-piece|(?:^|-)suit(?:-|$)/.test(slugNorm)) {
      return "full";
    }
    if (BLAZER_SLUGS.test(slugNorm) && !/tuxedo|suit/.test(slugNorm)) {
      return "upper";
    }
    if (/(?:^|-)blazer(?:-|$)/.test(slugNorm) && !/tuxedo|suit/.test(slugNorm)) {
      return "upper";
    }
  }

  if (/\bblazer\b/.test(haystack) && !/\b(suit|tuxedo)\b/.test(haystack)) {
    return "upper";
  }

  if (TOP_OUTERWEAR.test(haystack) && !/\b(suit|tuxedo)\b/.test(haystack)) {
    return "upper";
  }

  if (FULL_ENSEMBLE.test(haystack)) {
    return "full";
  }

  if (/\b(suit|pinstripe|double-breasted|herringbone)\b/.test(haystack)) {
    return "full";
  }

  return "full";
}

/** True only for jacket/blazer products — never for tuxedos or full suits. */
export function shouldPreservePersonLowerBody(
  coverage: GarmentCoverage,
  slug?: string | null
): boolean {
  if (coverage !== "upper") return false;

  const slugNorm = slug?.trim().toLowerCase() ?? "";
  if (slugNorm) {
    if (/tuxedo|double-breasted|three-piece|suit/.test(slugNorm)) {
      return false;
    }
    if (/(?:^|-)blazer(?:-|$)/.test(slugNorm)) {
      return true;
    }
  }

  return false;
}

/** Infer shirt underlayer and body coverage from product metadata. */
export function inferGarmentStyling(
  nameEn: string,
  descEn?: string | null,
  slug?: string | null
): GarmentStyling {
  const haystack = `${nameEn} ${descEn ?? ""} ${slug ?? ""}`.toLowerCase();
  const coverage = inferGarmentCoverage(haystack, slug);

  if (coverage === "full") {
    return { needsUnderlayer: false, underlayerText: null, coverage };
  }

  if (SHIRT_ALREADY_MENTIONED.test(`${nameEn} ${descEn ?? ""}`)) {
    return { needsUnderlayer: false, underlayerText: null, coverage };
  }

  return {
    needsUnderlayer: true,
    underlayerText: pickUnderlayer(haystack),
    coverage,
  };
}

function pickUnderlayer(haystack: string): string {
  if (
    /velvet|evening|smoking|dinner|midnight|obsidian|burgundy|plum|black|navy velvet|charcoal velvet|formal|tuxedo/.test(
      haystack
    )
  ) {
    return "a crisp white formal dress shirt with a structured collar visible at the neckline";
  }

  if (
    /linen|summer|resort|coral|mint|sage|sky blue|sand|taupe|white cotton|powder|terracotta|olive/.test(
      haystack
    )
  ) {
    return "a white or soft cream linen shirt, neatly worn under the jacket with collar visible";
  }

  if (/business|oxford|herringbone|pinstripe|steel|slate|graphite|charcoal|navy/.test(haystack)) {
    return "a light blue or white dress shirt, buttoned appropriately for business tailoring";
  }

  if (/camel|espresso|brown|taupe|warm/.test(haystack)) {
    return "a white or pale blue dress shirt that complements warm tailoring tones";
  }

  return "a crisp white dress shirt visible at the collar and upper chest, appropriate for luxury menswear";
}

export function buildUnderlayerPromptSection(styling: GarmentStyling): string {
  if (!styling.needsUnderlayer || !styling.underlayerText) return "";

  return `
=== UNDERLAYER ===
- The reference is outerwear only — add ${styling.underlayerText} beneath the jacket at the collar and chest.`;
}
