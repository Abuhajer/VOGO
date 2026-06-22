import { drawObjectContainInCanvas } from "@/lib/objectFitCrop";

export type CameraViewRotation = 0 | 90 | 180 | 270;
export type CameraFacingMode = "user" | "environment";

function normalizeRotation(r: CameraViewRotation): CameraViewRotation {
  const n = ((r % 360) + 360) % 360;
  if (n === 0 || n === 90 || n === 180 || n === 270) return n;
  return 0;
}

/**
 * Mobile cameras often deliver landscape sensor buffers while the browser rotates the
 * live preview for portrait-held devices. Front and back cameras need opposite corrections.
 */
export function getVideoCaptureRotation(
  videoWidth: number,
  videoHeight: number,
  facingMode: CameraFacingMode,
  viewportPortrait?: boolean
): CameraViewRotation {
  if (!videoWidth || !videoHeight || videoHeight > videoWidth) {
    return 0;
  }

  const portrait =
    viewportPortrait ??
    (typeof window !== "undefined" && window.innerHeight >= window.innerWidth);

  if (!portrait) {
    return 0;
  }

  return facingMode === "user" ? 270 : 90;
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

/** Rotate raw sensor buffer to upright portrait (preview applies rotation before mirror). */
function orientVideoFrame(
  video: HTMLVideoElement,
  rotation: CameraViewRotation
): HTMLCanvasElement | null {
  const iw = video.videoWidth;
  const ih = video.videoHeight;
  if (!iw || !ih) return null;

  const rot = normalizeRotation(rotation);
  if (rot === 0) {
    const canvas = document.createElement("canvas");
    canvas.width = iw;
    canvas.height = ih;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }

  const ow = rot === 90 || rot === 270 ? ih : iw;
  const oh = rot === 90 || rot === 270 ? iw : ih;
  const canvas = document.createElement("canvas");
  canvas.width = ow;
  canvas.height = oh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.translate(ow / 2, oh / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(video, -iw / 2, -ih / 2);
  return canvas;
}

function mirrorCanvasHorizontal(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/**
 * JPEG data URL: portrait frame matching the capture station preview
 * (`object-fit: contain`, `object-position: center`, optional front-camera mirror).
 */
export function capturePortrait9x16FromVideo(
  video: HTMLVideoElement,
  options: {
    mirror: boolean;
    facingMode?: CameraFacingMode;
    rotation?: CameraViewRotation;
    quality?: number;
    maxLongEdge?: number;
  }
): string | null {
  const iw = video.videoWidth;
  const ih = video.videoHeight;
  if (!iw || !ih) return null;

  const cw = video.clientWidth;
  const ch = video.clientHeight;
  if (!cw || !ch) return null;

  const quality = options.quality ?? 0.92;
  const maxLongEdge = options.maxLongEdge ?? 2560;
  const facingMode = options.facingMode ?? "user";
  const rotation =
    options.rotation ?? getVideoCaptureRotation(iw, ih, facingMode);

  let frame = orientVideoFrame(video, rotation);
  if (!frame) return null;

  if (options.mirror) {
    frame = mirrorCanvasHorizontal(frame);
  }

  const scale = maxLongEdge / Math.max(cw, ch);
  const outW = Math.max(1, Math.round(cw * scale));
  const outH = Math.max(1, Math.round(ch * scale));

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d");
  if (!octx) return null;

  drawObjectContainInCanvas(octx, frame, frame.width, frame.height, outW, outH);
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
