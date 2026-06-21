import { getSharp } from "./sharpLazy";
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
    const sharp = await getSharp();
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

/** Sample edge/corner tone from person photo for letterbox padding (not flat black). */
async function personCanvasBackground(personBuf: Buffer): Promise<Rgba> {
  const sharp = await getSharp();
  const meta = await sharp(personBuf).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const sample = Math.max(1, Math.min(8, Math.floor(Math.min(w, h) * 0.02)));

  const { data, info } = await sharp(personBuf)
    .extract({ left: 0, top: 0, width: sample, height: sample })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = data.length / channels;
  for (let i = 0; i < data.length; i += channels) {
    r += data[i];
    g += data[i + 1] ?? data[i];
    b += data[i + 2] ?? data[i];
  }
  return {
    r: Math.min(255, Math.max(0, Math.round(r / pixels))),
    g: Math.min(255, Math.max(0, Math.round(g / pixels))),
    b: Math.min(255, Math.max(0, Math.round(b / pixels))),
    alpha: 1,
  };
}

/**
 * Uniform scale to fit inside target canvas (no crop), then centre-pad to exact W×H.
 * Fixes square model output (e.g. 464×464) landing on portrait canvas (464×1032).
 */
async function fitInsideExactCanvas(
  imageBuffer: Buffer,
  targetW: number,
  targetH: number,
  bg: Rgba
): Promise<Buffer> {
  const sharp = await getSharp();
  const resized = await sharp(imageBuffer)
    .resize(targetW, targetH, {
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const scaledW = meta.width ?? targetW;
  const scaledH = meta.height ?? targetH;

  if (scaledW === targetW && scaledH === targetH) {
    return resized;
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

async function readImageDimensions(buffer: Buffer): Promise<ImageDimensions> {
  const sharp = await getSharp();
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

/**
 * Post-process model output to EXACT person input pixel dimensions.
 * Always uses fit:inside + letterbox pad on aspect mismatch (never cover/crop).
 */
export async function lockOutputToPersonDimensions(
  personImageRefUrl: string,
  resultBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number; personWidth: number; personHeight: number }> {
  const personDims = await getPersonImageDimensions(personImageRefUrl);
  if (!personDims?.width || !personDims?.height) {
    throw new Error("[TryOn] Cannot read person photo dimensions for output lock");
  }

  const personBuf = await readImageBufferFromRef(personImageRefUrl);
  const bg = await personCanvasBackground(personBuf);
  const { width: resultW, height: resultH } = await readImageDimensions(resultBuffer);
  const targetW = personDims.width;
  const targetH = personDims.height;

  if (!resultW || !resultH) {
    throw new Error("[TryOn] Model returned image with no readable dimensions");
  }

  console.log(`[TryOn] Normalize ${resultW}×${resultH} → ${targetW}×${targetH}`);

  let buffer: Buffer;

  if (resultW === targetW && resultH === targetH) {
    buffer = resultBuffer;
  } else if (aspectRatiosMatch(resultW, resultH, targetW, targetH)) {
    console.log(`[TryOn] Uniform scale (matched aspect)`);
    const sharp = await getSharp();
    buffer = await sharp(resultBuffer)
      .resize(targetW, targetH, { kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
  } else {
    console.warn(`[TryOn] Aspect mismatch — scale inside + letterbox pad (no crop)`);
    buffer = await fitInsideExactCanvas(resultBuffer, targetW, targetH, bg);
  }

  const final = await readImageDimensions(buffer);
  if (final.width !== targetW || final.height !== targetH) {
    console.warn(
      `[TryOn] Post-pad check ${final.width}×${final.height} — forcing ${targetW}×${targetH}`
    );
    buffer = await fitInsideExactCanvas(buffer, targetW, targetH, bg);
  }

  const verified = await readImageDimensions(buffer);
  if (verified.width !== targetW || verified.height !== targetH) {
    throw new Error(
      `[TryOn] Dimension lock failed: output ${verified.width}×${verified.height}, expected ${targetW}×${targetH}`
    );
  }

  console.log(`[TryOn] ✓ Output locked ${targetW}×${targetH} (person canvas)`);

  return {
    buffer,
    width: targetW,
    height: targetH,
    personWidth: targetW,
    personHeight: targetH,
  };
}

/** @deprecated Use lockOutputToPersonDimensions */
export async function enforceExactPersonDimensions(
  personImageRefUrl: string,
  resultBuffer: Buffer
): Promise<Buffer> {
  const { buffer } = await lockOutputToPersonDimensions(personImageRefUrl, resultBuffer);
  return buffer;
}

/** @deprecated Use lockOutputToPersonDimensions */
export async function assertExactPersonCanvas(
  personImageRefUrl: string,
  buffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const locked = await lockOutputToPersonDimensions(personImageRefUrl, buffer);
  return { buffer: locked.buffer, width: locked.width, height: locked.height };
}

/** @deprecated Use lockOutputToPersonDimensions */
export const normalizeTransformBufferToPersonDimensions = enforceExactPersonDimensions;
