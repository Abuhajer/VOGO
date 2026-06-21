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

type Rgba = { r: number; g: number; b: number; alpha: number };

async function personCanvasBackground(personBuf: Buffer): Promise<Rgba> {
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
 * Scale image uniformly to fit inside target canvas (no crop), then pad to exact W×H.
 * Sharp `fit: inside` alone does not always emit the padded canvas size.
 */
async function fitInsideExactCanvas(
  imageBuffer: Buffer,
  targetW: number,
  targetH: number,
  bg: Rgba
): Promise<Buffer> {
  const resized = await sharp(imageBuffer)
    .resize(targetW, targetH, {
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const scaledW = meta.width ?? targetW;
  const scaledH = meta.height ?? targetH;

  if (scaledW === targetW && scaledH === targetH) {
    return sharp(resized).png().toBuffer();
  }

  const left = Math.floor((targetW - scaledW) / 2);
  const top = Math.floor((targetH - scaledH) / 2);

  return sharp({
    create: {
      width: targetW,
      height: targetH,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

/**
 * Pad/scale model output to the person photo's exact pixel width × height.
 * Uses uniform scale + centre pad (no crop, no zoom-in).
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
      console.log(
        `[TryOn] Uniform scale ${resultW}×${resultH} → ${targetW}×${targetH} (matched aspect)`
      );
      return sharp(resultBuffer)
        .resize(targetW, targetH, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
    }

    console.warn(
      `[TryOn] Aspect mismatch ${resultW}×${resultH} → ${targetW}×${targetH}; scale inside + pad (no crop)`
    );

    return fitInsideExactCanvas(resultBuffer, targetW, targetH, bg);
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
      `[TryOn] Final canvas ${width}×${height} → forcing ${dims.width}×${dims.height} (inside pad)`
    );
    const personBuf = await readImageBufferFromRef(personImageRefUrl);
    const bg = await personCanvasBackground(personBuf);
    normalized = await fitInsideExactCanvas(normalized, dims.width, dims.height, bg);
    width = dims.width;
    height = dims.height;
  }

  return { buffer: normalized, width, height };
}

/** @deprecated Use enforceExactPersonDimensions */
export const normalizeTransformBufferToPersonDimensions = enforceExactPersonDimensions;
