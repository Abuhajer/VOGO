import { prisma } from "@/lib/db";
import {
  FITTING_ROOM_STATIC_CATALOG,
  getStaticFittingRoomProductById,
  getStaticFittingRoomProductBySlug,
} from "@/lib/catalog/fitting-room-catalog";
import type { FittingRoomProduct } from "@/lib/try-on/types";

const productSelect = {
  id: true,
  slug: true,
  nameAr: true,
  nameEn: true,
  descAr: true,
  descEn: true,
  imageSrc: true,
  price: true,
} as const;

function logDbFallback(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[fitting-room] ${context}: database unavailable — using static catalog (${message})`);
}

export async function getFittingRoomProducts(): Promise<FittingRoomProduct[]> {
  try {
    return await prisma.product.findMany({
      where: { active: true },
      select: productSelect,
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    logDbFallback("getFittingRoomProducts", err);
    return FITTING_ROOM_STATIC_CATALOG;
  }
}

export async function getFittingRoomProductById(id: string): Promise<FittingRoomProduct | null> {
  try {
    const product = await prisma.product.findFirst({
      where: { id, active: true },
      select: productSelect,
    });
    if (product) return product;
  } catch (err) {
    logDbFallback("getFittingRoomProductById", err);
  }
  return getStaticFittingRoomProductById(id);
}

export async function getFittingRoomProductBySlug(slug: string): Promise<FittingRoomProduct | null> {
  try {
    const product = await prisma.product.findFirst({
      where: { slug, active: true },
      select: productSelect,
    });
    if (product) return product;
  } catch (err) {
    logDbFallback("getFittingRoomProductBySlug", err);
  }
  return getStaticFittingRoomProductBySlug(slug);
}
