import { NextResponse } from "next/server";
import { z } from "zod";
import { runVirtualTryOn } from "@/lib/try-on/generate";
import { classifyTryOnError } from "@/lib/try-on/errors";
import {
  getFittingRoomProductById,
  getFittingRoomProductBySlug,
} from "@/server/fitting-room";

export const maxDuration = 180;
export const runtime = "nodejs";

const bodySchema = z
  .object({
    personImageUrl: z.string().min(1),
    productId: z.string().optional(),
    productSlug: z.string().optional(),
    garmentImageUrl: z.string().optional(),
    garmentDescription: z.string().optional(),
  })
  .refine(
    (d) => d.productId || d.productSlug || d.garmentImageUrl,
    "Provide productId, productSlug, or garmentImageUrl"
  );

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request", code: "INVALID" },
        { status: 400 }
      );
    }

    const { personImageUrl, productId, productSlug, garmentImageUrl, garmentDescription } =
      parsed.data;

    let garmentUrl = garmentImageUrl;
    let resolvedProduct: Awaited<ReturnType<typeof getFittingRoomProductById>> = null;

    if (productId || productSlug) {
      resolvedProduct = productId
        ? await getFittingRoomProductById(productId)
        : await getFittingRoomProductBySlug(productSlug!);
      if (!resolvedProduct) {
        return NextResponse.json({ error: "Product not found", code: "NOT_FOUND" }, { status: 404 });
      }
      garmentUrl = resolvedProduct.imageSrc;
    }

    if (!garmentUrl) {
      return NextResponse.json(
        { error: "Garment image required", code: "INVALID" },
        { status: 400 }
      );
    }

    const result = await runVirtualTryOn({
      personImageUrl,
      garmentImageUrl: garmentUrl,
      garmentDescription: garmentDescription,
      productSlug: resolvedProduct?.slug ?? productSlug ?? null,
      productNameEn: resolvedProduct?.nameEn ?? null,
      productDescEn: resolvedProduct?.descEn ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[fitting-room/generate]", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    const classified = classifyTryOnError(message);

    return NextResponse.json(
      {
        error: message,
        code: classified.code,
        retryAfterSeconds: classified.retryAfterSeconds,
      },
      { status: classified.httpStatus }
    );
  }
}
