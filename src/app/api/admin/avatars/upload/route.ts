import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveAvatarBuffer } from "@/lib/fitting-room/avatar-storage";
import { Role } from "@/types/db";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/jpeg";
      const { url } = await saveAvatarBuffer(buffer, `avatar-${Date.now()}`, mime);
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "Expected multipart file upload" }, { status: 400 });
  } catch (err) {
    console.error("[admin/avatars/upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
