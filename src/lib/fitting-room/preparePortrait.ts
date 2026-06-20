/** Client-side resize + compress before fitting-room upload (keeps original framing). */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.88): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/jpeg",
      quality
    );
  });
}

/** Downscale photo while preserving aspect ratio (no crop) and return a JPEG blob. */
export async function preparePortraitBlob(
  file: File,
  maxLongEdge = 1600
): Promise<Blob> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  if (!width || !height) {
    throw new Error("Invalid image dimensions");
  }

  let outW = width;
  let outH = height;

  if (Math.max(outW, outH) > maxLongEdge) {
    const scale = maxLongEdge / Math.max(outW, outH);
    outW = Math.max(1, Math.round(outW * scale));
    outH = Math.max(1, Math.round(outH * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, outW, outH);
  return canvasToBlob(canvas);
}

/** Upload portrait blob via multipart (avoids large JSON body limits). */
export async function uploadPortraitBlob(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "portrait.jpg");

  const res = await fetch("/api/fitting-room/upload", {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed");
  }

  return data.url;
}

/** Convert a JPEG data URL (camera capture) to blob and upload. */
export async function uploadPortraitDataUrl(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const portrait =
    blob.type === "image/jpeg"
      ? blob
      : await preparePortraitBlob(new File([blob], "capture.jpg", { type: blob.type }));

  return uploadPortraitBlob(portrait);
}
