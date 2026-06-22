export type ObjectPositionVertical = "center" | "top" | "bottom";

/**
 * Source rectangle in image pixel space visible with `object-fit: cover` in a viewport.
 * `verticalPosition` matches CSS `object-position` on the vertical axis (preview uses center top).
 */
export function getObjectCoverSourceRectInPixels(
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  verticalPosition: ObjectPositionVertical = "center"
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(cw / iw, ch / ih);
  const sw = cw / scale;
  const sh = ch / scale;
  const sx = (iw - sw) / 2;
  let sy: number;
  if (verticalPosition === "top") {
    sy = 0;
  } else if (verticalPosition === "bottom") {
    sy = ih - sh;
  } else {
    sy = (ih - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

/**
 * Draw image/video into a viewport using `object-fit: contain` (full frame visible, letterboxed).
 */
export function drawObjectContainInCanvas(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  fillStyle = "#050508"
): void {
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(source, 0, 0, iw, ih, dx, dy, dw, dh);
}

/**
 * Source rectangle in video/image pixel space visible with `object-fit: cover` (center crop).
 */
export function getObjectCoverSourceRect(
  media: HTMLVideoElement | HTMLImageElement
): { sx: number; sy: number; sw: number; sh: number } | null {
  const iw =
    media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
  const ih =
    media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
  const cw = media.clientWidth;
  const ch = media.clientHeight;
  if (!iw || !ih || !cw || !ch) {
    return null;
  }

  return getObjectCoverSourceRectInPixels(iw, ih, cw, ch, "center");
}

/** Center "cover" crop in image pixel space to a target width:height ratio (portrait 9:16 → 9/16). */
export function getCenterCoverRectInPixels(
  iw: number,
  ih: number,
  aspectWidthOverHeight: number
): { sx: number; sy: number; sw: number; sh: number } {
  const srcAspect = iw / ih;
  if (srcAspect > aspectWidthOverHeight) {
    const sh = ih;
    const sw = ih * aspectWidthOverHeight;
    return { sx: (iw - sw) / 2, sy: 0, sw, sh };
  }
  const sw = iw;
  const sh = iw / aspectWidthOverHeight;
  return { sx: 0, sy: (ih - sh) / 2, sw, sh };
}
