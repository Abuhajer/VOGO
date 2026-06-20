import { prisma } from "@/lib/db";
import type { FittingRoomProduct } from "@/lib/try-on/types";

export async function getFittingRoomProducts(): Promise<FittingRoomProduct[]> {
  return prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      nameEn: true,
      descAr: true,
      descEn: true,
      imageSrc: true,
      price: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getFittingRoomProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, active: true },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      nameEn: true,
      descAr: true,
      descEn: true,
      imageSrc: true,
      price: true,
    },
  });
}

export async function getFittingRoomProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      nameEn: true,
      descAr: true,
      descEn: true,
      imageSrc: true,
      price: true,
    },
  });
}
