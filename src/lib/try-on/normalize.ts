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

function aspectRatio(width: number, height: number): number {
  return width / height;
}

function aspectRatiosMatch(aW: number, aH: number, bW: number, bH: number): boolean {
  const a = aspectRatio(aW, aH);
  const b = aspectRatio(bW, bH);
  return Math.abs(a - b) / Math.max(a, b) < 0.004;
}

async function personCanvasBackground(
  personBuf: Buffer
): Promise<{ r: number; g: number; b: number; alpha: number }> {
  const stats = await sharp(personBuf).stats();
  const m0 = stats.channels[0].mean;
  const m1 = stats.channels[1]?.mean ?? m0;
  const m2 = stats.channels[2]?.mean ?? m0;
  return {
    r: Math.min(255, Math.max(0, Math.round(m0))),
    g: Math.min(255, Math.max(0, Math.round(m1))),
    b: Math.min(255, Math.max(0, Math.round(m2))),
    alpha: 1,
  };
}

/**
 * Pad/scale model output to the person photo's exact pixel width × height.
 * Uses `fit: inside` so the full frame stays visible (no zoom-in crop).
 * Background pad tone is sampled from the person photo — never flat black bars.
 */
export async function enforceExactPersonDimensions(
  personImageRefUrl: string,
  resultBuffer: Buffer
): Promise<Buffer> {
  try {
    const personBuf = await readImageBufferFromRef(personImageRefUrl);
    const [personMeta, resultMeta] = await Promise.all([
      sharp(personBuf).metadata(),
      sharp(resultBuffer).metadata(),
    ]);
    const targetW = personMeta.width ?? 0;
    const targetH = personMeta.height ?? 0;
    const resultW = resultMeta.width ?? 0;
    const resultH = resultMeta.height ?? 0;
    if (!targetW || !targetH || !resultW || !resultH) return resultBuffer;

    if (resultW === targetW && resultH === targetH) {
      return resultBuffer;
    }

    const bg = await personCanvasBackground(personBuf);

    if (aspectRatiosMatch(resultW, resultH, targetW, targetH)) {
      return sharp(resultBuffer)
        .resize(targetW, targetH, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
    }

    console.warn(
      `[TryOn] Aspect mismatch result ${resultW}×${resultH} → person ${targetW}×${targetH}; scaling inside canvas (no crop/zoom)`
    );

    return sharp(resultBuffer)
      .resize(targetW, targetH, {
        fit: "inside",
        position: "centre",
        background: bg,
        kernel: sharp.kernel.lanczos3,
      })
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

/** Final guard — always emit exact person canvas size before saving. */
export async function assertExactPersonCanvas(
  personImageRefUrl: string,
  buffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const dims = await getPersonImageDimensions(personImageRefUrl);
  if (!dims) {
    const meta = await sharp(buffer).metadata();
    return {
      buffer,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  }

  let normalized = await enforceExactPersonDimensions(personImageRefUrl, buffer);
  const meta = await sharp(normalized).metadata();
  let width = meta.width ?? dims.width;
  let height = meta.height ?? dims.height;

  if (width !== dims.width || height !== dims.height) {
    console.warn(
      `[TryOn] Final canvas ${width}×${height} → ${dims.width}×${dims.height} (inside pad, no crop)`
    );
    const personBuf = await readImageBufferFromRef(personImageRefUrl);
    const bg = await personCanvasBackground(personBuf);
    normalized = await sharp(normalized)
      .resize(dims.width, dims.height, {
        fit: "inside",
        position: "centre",
        background: bg,
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
    width = dims.width;
    height = dims.height;
  }

  return { buffer: normalized, width, height };
}

/** @deprecated Use enforceExactPersonDimensions */
export const normalizeTransformBufferToPersonDimensions = enforceExactPersonDimensions;
