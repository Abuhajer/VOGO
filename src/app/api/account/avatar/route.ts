import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveAvatarBuffer } from "@/lib/avatar-storage";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const mime = file.type || "image/jpeg";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await saveAvatarBuffer(buffer, session.user.id, mime);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    });

    try {
      revalidatePath("/ar/dashboard", "page");
      revalidatePath("/en/dashboard", "page");
    } catch (err) {
      console.warn("[account/avatar] revalidatePath failed", err);
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[account/avatar]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
