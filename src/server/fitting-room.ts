import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  FITTING_ROOM_STATIC_CATALOG,
  getStaticFittingRoomProductById,
  getStaticFittingRoomProductBySlug,
} from "@/lib/catalog/fitting-room-catalog";
import type { FittingRoomProduct } from "@/lib/try-on/types";
import { enrichFittingRoomProducts } from "@/server/promotions";

const productSelect = {
  id: true,
  slug: true,
  nameAr: true,
  nameEn: true,
  descAr: true,
  descEn: true,
  imageSrc: true,
  price: true,
  collectionId: true,
} as const;

function logDbFallback(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[fitting-room] ${context}: database unavailable — using static catalog (${message})`);
}

async function withSalePricing(products: FittingRoomProduct[]): Promise<FittingRoomProduct[]> {
  try {
    return await enrichFittingRoomProducts(products);
  } catch (err) {
    console.error("[fitting-room] sale pricing enrichment failed", err);
    return products;
  }
}

export async function getFittingRoomProducts(): Promise<FittingRoomProduct[]> {
  if (!isDatabaseConfigured()) {
    return withSalePricing(FITTING_ROOM_STATIC_CATALOG);
  }

  try {
    const prisma = getPrisma();
    if (!prisma) return withSalePricing(FITTING_ROOM_STATIC_CATALOG);

    const products = await prisma.product.findMany({
      where: { active: true },
      select: productSelect,
      orderBy: { createdAt: "asc" },
    });
    return withSalePricing(products);
  } catch (err) {
    logDbFallback("getFittingRoomProducts", err);
    return withSalePricing(FITTING_ROOM_STATIC_CATALOG);
  }
}

export async function getFittingRoomProductById(id: string): Promise<FittingRoomProduct | null> {
  let product: FittingRoomProduct | null = null;

  if (!isDatabaseConfigured()) {
    product = getStaticFittingRoomProductById(id);
  } else {
    try {
      const prisma = getPrisma();
      if (!prisma) {
        product = getStaticFittingRoomProductById(id);
      } else {
        product = await prisma.product.findFirst({
          where: { id, active: true },
          select: productSelect,
        });
      }
    } catch (err) {
      logDbFallback("getFittingRoomProductById", err);
    }
    product ??= getStaticFittingRoomProductById(id);
  }

  if (!product) return null;
  const [enriched] = await withSalePricing([product]);
  return enriched ?? product;
}

export async function getFittingRoomProductBySlug(slug: string): Promise<FittingRoomProduct | null> {
  let product: FittingRoomProduct | null = null;

  if (!isDatabaseConfigured()) {
    product = getStaticFittingRoomProductBySlug(slug);
  } else {
    try {
      const prisma = getPrisma();
      if (!prisma) {
        product = getStaticFittingRoomProductBySlug(slug);
      } else {
        product = await prisma.product.findFirst({
          where: { slug, active: true },
          select: productSelect,
        });
      }
    } catch (err) {
      logDbFallback("getFittingRoomProductBySlug", err);
    }
    product ??= getStaticFittingRoomProductBySlug(slug);
  }

  if (!product) return null;
  const [enriched] = await withSalePricing([product]);
  return enriched ?? product;
}
