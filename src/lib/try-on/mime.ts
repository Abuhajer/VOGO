/** Infer MIME type from a public URL path or filename. */
export function mimeFromPublicPath(urlPath: string): string {
  const lower = urlPath.split("?")[0]?.toLowerCase() ?? "";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
