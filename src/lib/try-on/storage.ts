import { readFileSync, existsSync } from "fs";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fitting-room");

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; filePath: string }> {
  await ensureUploadDir();
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, finalName);
  await writeFile(filePath, buffer);
  return {
    url: `/uploads/fitting-room/${finalName}`,
    filePath,
  };
}

/** Read a local public path like `/uploads/fitting-room/foo.jpg` or `/fitting-room/avatars/a.svg`. */
export function readLocalPublicFile(urlPath: string): Buffer | null {
  if (!urlPath || urlPath.startsWith("data:")) return null;
  const normalized = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  const filePath = path.join(process.cwd(), "public", normalized);
  if (!existsSync(filePath)) return null;
  try {
    return readFileSync(filePath);
  } catch {
    return null;
  }
}

export async function readLocalPublicFileAsync(urlPath: string): Promise<Buffer | null> {
  if (!urlPath || urlPath.startsWith("data:")) return null;
  const normalized = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  const filePath = path.join(process.cwd(), "public", normalized);
  if (!existsSync(filePath)) return null;
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

/** Resolve relative public URL to absolute for external fetch fallback. */
export function resolvePublicUrl(url: string, siteUrl?: string): string {
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
