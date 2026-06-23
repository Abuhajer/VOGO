import type { CustomSizeFields, MeasurementRange, StandardSize } from "@/lib/product-sizes";

export type MannequinMeasurements = {
  chestCm: number;
  waistCm: number;
  jacketLengthCm: number;
  sleeveCm: number;
  shoulderCm: number;
  heightCm: number;
};

export const MANNEQUIN_BASELINE: MannequinMeasurements = {
  chestCm: 96,
  waistCm: 84,
  jacketLengthCm: 72,
  sleeveCm: 61,
  shoulderCm: 45,
  heightCm: 175,
};

export type MannequinScales = {
  chestScale: number;
  waistScale: number;
  shoulderScale: number;
  torsoLengthScale: number;
  heightScale: number;
  sleeveScale: number;
};

function midpoint(range: MeasurementRange) {
  return Math.round((range.min + range.max) / 2);
}

export function measurementsFromStandardSize(size: StandardSize): MannequinMeasurements {
  return {
    chestCm: midpoint(size.chestCm),
    waistCm: midpoint(size.waistCm),
    jacketLengthCm: midpoint(size.jacketLengthCm),
    sleeveCm: midpoint(size.sleeveCm),
    shoulderCm: midpoint(size.shoulderCm),
    heightCm: midpoint(size.heightCm),
  };
}

export function measurementsFromCustom(fields: CustomSizeFields): MannequinMeasurements {
  return { ...fields };
}

export function clampScale(value: number, min = 0.82, max = 1.18) {
  return Math.min(max, Math.max(min, value));
}

export function mannequinScales(measurements: MannequinMeasurements): MannequinScales {
  const base = MANNEQUIN_BASELINE;
  return {
    chestScale: clampScale(measurements.chestCm / base.chestCm),
    waistScale: clampScale(measurements.waistCm / base.waistCm),
    shoulderScale: clampScale(measurements.shoulderCm / base.shoulderCm),
    torsoLengthScale: clampScale(measurements.jacketLengthCm / base.jacketLengthCm),
    heightScale: clampScale(measurements.heightCm / base.heightCm),
    sleeveScale: clampScale(measurements.sleeveCm / base.sleeveCm),
  };
}

export type MannequinHighlight = keyof MannequinMeasurements | null;

export function defaultMannequinMeasurements(): MannequinMeasurements {
  return { ...MANNEQUIN_BASELINE };
}
