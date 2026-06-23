export type MeasurementRange = {
  min: number;
  max: number;
};

export type StandardSize = {
  code: string;
  labelEn: string;
  labelAr: string;
  chestCm: MeasurementRange;
  waistCm: MeasurementRange;
  jacketLengthCm: MeasurementRange;
  sleeveCm: MeasurementRange;
  shoulderCm: MeasurementRange;
  heightCm: MeasurementRange;
};

export type CustomSizeFields = {
  chestCm: number;
  waistCm: number;
  jacketLengthCm: number;
  sleeveCm: number;
  shoulderCm: number;
  heightCm: number;
};

export type ProductSizeChart = {
  standardSizes: StandardSize[];
};

export const DEFAULT_MENSWEAR_SIZES: StandardSize[] = [
  {
    code: "46",
    labelEn: "EU 46",
    labelAr: "مقاس 46",
    chestCm: { min: 86, max: 90 },
    waistCm: { min: 74, max: 78 },
    jacketLengthCm: { min: 68, max: 70 },
    sleeveCm: { min: 58, max: 60 },
    shoulderCm: { min: 42, max: 44 },
    heightCm: { min: 165, max: 170 },
  },
  {
    code: "48",
    labelEn: "EU 48",
    labelAr: "مقاس 48",
    chestCm: { min: 90, max: 94 },
    waistCm: { min: 78, max: 82 },
    jacketLengthCm: { min: 70, max: 72 },
    sleeveCm: { min: 59, max: 61 },
    shoulderCm: { min: 43, max: 45 },
    heightCm: { min: 168, max: 175 },
  },
  {
    code: "50",
    labelEn: "EU 50",
    labelAr: "مقاس 50",
    chestCm: { min: 94, max: 98 },
    waistCm: { min: 82, max: 86 },
    jacketLengthCm: { min: 72, max: 74 },
    sleeveCm: { min: 60, max: 62 },
    shoulderCm: { min: 44, max: 46 },
    heightCm: { min: 172, max: 178 },
  },
  {
    code: "52",
    labelEn: "EU 52",
    labelAr: "مقاس 52",
    chestCm: { min: 98, max: 102 },
    waistCm: { min: 86, max: 90 },
    jacketLengthCm: { min: 74, max: 76 },
    sleeveCm: { min: 61, max: 63 },
    shoulderCm: { min: 45, max: 47 },
    heightCm: { min: 175, max: 182 },
  },
  {
    code: "54",
    labelEn: "EU 54",
    labelAr: "مقاس 54",
    chestCm: { min: 102, max: 106 },
    waistCm: { min: 90, max: 94 },
    jacketLengthCm: { min: 76, max: 78 },
    sleeveCm: { min: 62, max: 64 },
    shoulderCm: { min: 46, max: 48 },
    heightCm: { min: 178, max: 185 },
  },
];

export function defaultProductSizeChart(): ProductSizeChart {
  return { standardSizes: DEFAULT_MENSWEAR_SIZES.map((size) => ({ ...size })) };
}

function normalizeRange(
  value: Partial<MeasurementRange> | undefined,
  fallback: MeasurementRange
): MeasurementRange {
  const min = Number(value?.min);
  const max = Number(value?.max);
  return {
    min: Number.isFinite(min) ? min : fallback.min,
    max: Number.isFinite(max) ? max : fallback.max,
  };
}

/** Fills missing size-chart measurements so inputs stay controlled. */
export function normalizeProductSizeChart(chart: ProductSizeChart): ProductSizeChart {
  const template = DEFAULT_MENSWEAR_SIZES[0];
  return {
    standardSizes: chart.standardSizes.map((size, index) => {
      const fallback = DEFAULT_MENSWEAR_SIZES[index] ?? template;
      const next: StandardSize = {
        code: size.code?.trim() || fallback.code,
        labelEn: size.labelEn?.trim() || fallback.labelEn,
        labelAr: size.labelAr?.trim() || fallback.labelAr,
        chestCm: normalizeRange(size.chestCm, fallback.chestCm),
        waistCm: normalizeRange(size.waistCm, fallback.waistCm),
        jacketLengthCm: normalizeRange(size.jacketLengthCm, fallback.jacketLengthCm),
        sleeveCm: normalizeRange(size.sleeveCm, fallback.sleeveCm),
        shoulderCm: normalizeRange(size.shoulderCm, fallback.shoulderCm),
        heightCm: normalizeRange(size.heightCm, fallback.heightCm),
      };
      return next;
    }),
  };
}

export function parseProductSizeChart(json: string | null | undefined): ProductSizeChart | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as ProductSizeChart;
    if (!parsed?.standardSizes?.length) return null;
    return normalizeProductSizeChart(parsed);
  } catch {
    return null;
  }
}

export function serializeProductSizeChart(chart: ProductSizeChart): string {
  return JSON.stringify(chart);
}

export function formatMeasurementRange(
  range: MeasurementRange,
  locale: string
): string {
  const sep = locale === "ar" ? "–" : "–";
  return `${range.min}${sep}${range.max} cm`;
}

export function buildCartLineId(productId: string, sizeCode: string): string {
  return `${productId}:${sizeCode}`;
}
