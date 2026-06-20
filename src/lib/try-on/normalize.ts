import sharp from "sharp";
import { readLocalPublicFileAsync, resolvePublicUrl } from "./storage";

export type ImageDimensions = {
  width: number;
  height: number;
};

export async function readImageBufferFromRef(imageRefUrl: string): Promise<Buffer> {
  if (imageRefUrl.startsWith("data:")) {
    const m = /^data:([^;,]+)[^,]*;base64,(.+)$/i.exec(imageRefUrl);
    if (!m) throw new Error("Invalid data: image URL");
    return Buffer.from(m[2], "base64");
  }

  const local = await readLocalPublicFileAsync(imageRefUrl);
  if (local) return local;

  const resolved = resolvePublicUrl(imageRefUrl);
  const res = await fetch(resolved);
  if (!res.ok) {
    throw new Error(`Failed to fetch image (HTTP ${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function getPersonImageDimensions(
  personImageRefUrl: string
): Promise<ImageDimensions | null> {
  try {
    const personBuf = await readImageBufferFromRef(personImageRefUrl);
    const meta = await sharp(personBuf).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

/** Resize AI output to the person photo's exact pixel size (full frame, no letterboxing). */
export async function enforceExactPersonDimensions(
  personImageRefUrl: string,
  resultBuffer: Buffer
): Promise<Buffer> {
  try {
    const personBuf = await readImageBufferFromRef(personImageRefUrl);
    const { width, height } = await sharp(personBuf).metadata();
    if (!width || !height) return resultBuffer;

    return sharp(resultBuffer)
      .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
  } catch (e) {
    console.warn(
      "enforceExactPersonDimensions: skipped",
      e instanceof Error ? e.message : e
    );
    return resultBuffer;
  }
}

/** @deprecated Use enforceExactPersonDimensions */
export const normalizeTransformBufferToPersonDimensions = enforceExactPersonDimensions;
