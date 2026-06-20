import { NextResponse } from "next/server";
import { ensureUploadDir, saveUploadBuffer } from "@/lib/try-on/storage";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await ensureUploadDir();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/jpeg";
      const { url } = await saveUploadBuffer(buffer, `person-${Date.now()}`, mime);
      return NextResponse.json({ url });
    }

    const body = (await request.json()) as { image?: string; mimeType?: string };
    const image = body.image?.trim();
    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    let buffer: Buffer;
    let mime = body.mimeType?.trim() || "image/jpeg";

    if (image.startsWith("data:")) {
      const m = /^data:([^;,]+)[^,]*;base64,(.+)$/i.exec(image);
      if (!m) {
        return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
      }
      mime = m[1].trim();
      buffer = Buffer.from(m[2], "base64");
    } else {
      return NextResponse.json(
        { error: "Expected base64 data URL or multipart file" },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }

    const { url } = await saveUploadBuffer(buffer, `person-${Date.now()}`, mime);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[fitting-room/upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
