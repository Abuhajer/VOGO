import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { bufferToDataUrl, isReadOnlyFilesystem } from "@/lib/try-on/storage";

const AVATAR_DIR = path.join(process.cwd(), "public", "fitting-room", "avatars");

export function getAvatarUploadDir(): string {
  return AVATAR_DIR;
}

export async function ensureAvatarUploadDir(): Promise<void> {
  if (isReadOnlyFilesystem()) return;
  await mkdir(AVATAR_DIR, { recursive: true });
}

export async function saveAvatarBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string }> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;

  if (isReadOnlyFilesystem()) {
    return { url: bufferToDataUrl(buffer, mimeType) };
  }

  await ensureAvatarUploadDir();
  const filePath = path.join(AVATAR_DIR, finalName);
  await writeFile(filePath, buffer);
  return { url: `/fitting-room/avatars/${finalName}` };
}
