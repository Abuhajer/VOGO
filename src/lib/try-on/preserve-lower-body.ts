import sharp from "sharp";
import type { GarmentCoverage } from "./garment-styling";
import { shouldPreservePersonLowerBody } from "./garment-styling";
import { readImageBufferFromRef } from "./normalize";

/** Waistline split — preserve person's legs/trousers below this ratio for upper-only garments. */
const LOWER_BODY_SPLIT_RATIO = 0.52;

/**
 * For blazer/jacket-only products, restore the person's original lower body
 * (trousers, lap, seat) so the AI does not paint jacket fabric over the legs.
 */
export async function preservePersonLowerBody(
  personImageRefUrl: string,
  resultBuffer: Buffer,
  coverage: GarmentCoverage,
  slug?: string | null
): Promise<Buffer> {
  if (!shouldPreservePersonLowerBody(coverage, slug)) {
    return resultBuffer;
  }

  try {
    const personBuf = await readImageBufferFromRef(personImageRefUrl);
    const personMeta = await sharp(personBuf).metadata();
    const width = personMeta.width ?? 0;
    const height = personMeta.height ?? 0;
    if (!width || !height) return resultBuffer;

    let alignedResult = resultBuffer;
    const resultMeta = await sharp(resultBuffer).metadata();
    if (resultMeta.width !== width || resultMeta.height !== height) {
      alignedResult = await sharp(resultBuffer)
        .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
    }

    const splitY = Math.round(height * LOWER_BODY_SPLIT_RATIO);
    const lowerStrip = await sharp(personBuf)
      .extract({ left: 0, top: splitY, width, height: height - splitY })
      .toBuffer();

    return sharp(alignedResult)
      .composite([{ input: lowerStrip, top: splitY, left: 0 }])
      .png()
      .toBuffer();
  } catch (error) {
    console.warn(
      "preservePersonLowerBody: skipped",
      error instanceof Error ? error.message : error
    );
    return resultBuffer;
  }
}
