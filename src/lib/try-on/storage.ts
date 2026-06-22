import { readFileSync, existsSync } from "fs";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fitting-room");

function isRailwayDeploy(): boolean {
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_ENVIRONMENT_ID ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_NAME ||
      process.env.RAILWAY_STATIC_URL
  );
}

/**
 * When true, try-on uploads return base64 data URLs instead of `/uploads/fitting-room/*`.
 * Required on serverless/read-only bundles and on PaaS with ephemeral disks (Railway, etc.)
 * where runtime writes are not served reliably across instances or redeploys.
 */
export function isReadOnlyFilesystem(): boolean {
  if (process.env.FITTING_ROOM_MEMORY_STORAGE?.trim().toLowerCase() === "true") {
    return true;
  }
  if (process.env.FITTING_ROOM_DISK_STORAGE?.trim().toLowerCase() === "true") {
    return false;
  }
  if (
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL ||
    process.env.AWS_EXECUTION_ENV
  ) {
    return true;
  }
  if (isRailwayDeploy()) {
    return true;
  }
  // Production without an explicit persistent upload volume — avoid broken /uploads/* URLs.
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  return false;
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const mime = mimeType.split(";")[0]?.trim() || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export async function ensureUploadDir(): Promise<void> {
  if (isReadOnlyFilesystem()) return;
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; filePath: string | null }> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;

  if (isReadOnlyFilesystem()) {
    return {
      url: bufferToDataUrl(buffer, mimeType),
      filePath: null,
    };
  }

  await ensureUploadDir();
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
