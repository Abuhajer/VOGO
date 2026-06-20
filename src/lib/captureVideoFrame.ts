import {
  getCenterCoverRectInPixels,
  getObjectCoverSourceRect,
} from "@/lib/objectFitCrop";

const PORTRAIT_ASPECT = 9 / 16;

type CameraViewRotation = 0 | 90 | 180 | 270;

function normalizeRotation(r: CameraViewRotation): CameraViewRotation {
  const n = ((r % 360) + 360) % 360;
  if (n === 0 || n === 90 || n === 180 || n === 270) return n;
  return 0;
}

function scaleCanvasToMaxLongEdge(
  source: HTMLCanvasElement,
  maxLongEdge: number,
  quality: number
): string {
  let w = source.width;
  let h = source.height;
  if (Math.max(w, h) <= maxLongEdge) {
    return source.toDataURL("image/jpeg", quality);
  }
  const scale = maxLongEdge / Math.max(w, h);
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));
  const scaled = document.createElement("canvas");
  scaled.width = w;
  scaled.height = h;
  const sctx = scaled.getContext("2d");
  if (!sctx) return source.toDataURL("image/jpeg", quality);
  sctx.drawImage(source, 0, 0, w, h);
  return scaled.toDataURL("image/jpeg", quality);
}

function mirrorRotateToCanvas(
  video: HTMLVideoElement,
  mirror: boolean,
  rotation: CameraViewRotation
): HTMLCanvasElement | null {
  const iw = video.videoWidth;
  const ih = video.videoHeight;
  if (!iw || !ih) return null;

  const off = document.createElement("canvas");
  off.width = iw;
  off.height = ih;
  const ox = off.getContext("2d");
  if (!ox) return null;
  if (mirror) {
    ox.translate(iw, 0);
    ox.scale(-1, 1);
  }
  ox.drawImage(video, 0, 0, iw, ih);

  const rot = normalizeRotation(rotation);
  if (rot === 0) {
    return off;
  }

  const ow = rot === 90 || rot === 270 ? ih : iw;
  const oh = rot === 90 || rot === 270 ? iw : ih;
  const out = document.createElement("canvas");
  out.width = ow;
  out.height = oh;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.translate(ow / 2, oh / 2);
  octx.rotate((rot * Math.PI) / 180);
  octx.drawImage(off, -iw / 2, -ih / 2);
  return out;
}

/**
 * JPEG data URL: 9:16 portrait crop matching the capture station preview
 * (`object-fit: cover` in a 9:16 box when rotation is 0).
 */
export function capturePortrait9x16FromVideo(
  video: HTMLVideoElement,
  options: {
    mirror: boolean;
    rotation?: CameraViewRotation;
    quality?: number;
    maxLongEdge?: number;
  }
): string | null {
  const iw = video.videoWidth;
  const ih = video.videoHeight;
  if (!iw || !ih) return null;

  const quality = options.quality ?? 0.92;
  const maxLongEdge = options.maxLongEdge ?? 2560;
  const rotation = normalizeRotation(options.rotation ?? 0);

  if (rotation === 0) {
    const crop = getObjectCoverSourceRect(video);
    if (!crop) return null;
    const { sx, sy, sw, sh } = crop;
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(sw));
    out.height = Math.max(1, Math.round(sh));
    const octx = out.getContext("2d");
    if (!octx) return null;
    octx.save();
    if (options.mirror) {
      octx.translate(out.width, 0);
      octx.scale(-1, 1);
    }
    octx.drawImage(video, sx, sy, sw, sh, 0, 0, out.width, out.height);
    octx.restore();
    return scaleCanvasToMaxLongEdge(out, maxLongEdge, quality);
  }

  const oriented = mirrorRotateToCanvas(video, options.mirror, rotation);
  if (!oriented) return null;
  const { sx, sy, sw, sh } = getCenterCoverRectInPixels(
    oriented.width,
    oriented.height,
    PORTRAIT_ASPECT
  );
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(sw));
  out.height = Math.max(1, Math.round(sh));
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.drawImage(oriented, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return scaleCanvasToMaxLongEdge(out, maxLongEdge, quality);
}

/** Validate portrait aspect ratio (~3:4 to 9:16). Returns true if acceptable. */
export function isPortraitAspect(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  // 9:16 ≈ 0.5625, 3:4 = 0.75 — accept portrait range with tolerance
  return ratio >= 0.5 && ratio <= 0.85;
}

export async function loadImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
