import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyTryOnError } from "@/lib/try-on/errors";
import {
  getFittingRoomProductById,
  getFittingRoomProductBySlug,
} from "@/server/fitting-room";

import type { TryOnProgressUpdate } from "@/lib/try-on/progress";

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
  const streamProgress = new URL(request.url).searchParams.get("stream") === "1";

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

    const { runVirtualTryOn } = await import("@/lib/try-on/generate");

    if (!streamProgress) {
      const result = await runVirtualTryOn({
        personImageUrl,
        garmentImageUrl: garmentUrl,
        garmentDescription: garmentDescription,
        productSlug: resolvedProduct?.slug ?? productSlug ?? null,
        productNameEn: resolvedProduct?.nameEn ?? null,
        productDescEn: resolvedProduct?.descEn ?? null,
      });
      return NextResponse.json(result);
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let closed = false;

        const send = (payload: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
          } catch {
            closed = true;
          }
        };

        const closeStream = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // Stream already closed (client disconnect or race with late progress tick).
          }
        };

        if (request.signal.aborted) {
          closeStream();
          return;
        }

        const onAbort = () => closeStream();
        request.signal.addEventListener("abort", onAbort, { once: true });

        try {
          const result = await runVirtualTryOn({
            personImageUrl,
            garmentImageUrl: garmentUrl,
            garmentDescription: garmentDescription,
            productSlug: resolvedProduct?.slug ?? productSlug ?? null,
            productNameEn: resolvedProduct?.nameEn ?? null,
            productDescEn: resolvedProduct?.descEn ?? null,
            onProgress: (update: TryOnProgressUpdate) => {
              send({ type: "progress", ...update });
            },
          });
          send({ type: "complete", ...result });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation failed";
          const classified = classifyTryOnError(message);
          send({
            type: "error",
            error: message,
            code: classified.code,
            retryAfterSeconds: classified.retryAfterSeconds,
          });
        } finally {
          request.signal.removeEventListener("abort", onAbort);
          closeStream();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
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
