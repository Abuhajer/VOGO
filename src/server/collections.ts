import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  getStaticCarouselProducts,
  getStaticShopProductsByCollection,
  STATIC_COLLECTIONS,
} from "@/lib/catalog/static-catalog";

export type CollectionSummary = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
};

function logDbFallback(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[collections] ${context}: database unavailable — using static catalog (${message})`);
}

export async function getActiveCollections() {
  if (!isDatabaseConfigured()) {
    return [...STATIC_COLLECTIONS];
  }

  try {
    const prisma = getPrisma();
    if (!prisma) return [...STATIC_COLLECTIONS];
    return await prisma.collection.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (err) {
    logDbFallback("getActiveCollections", err);
    return [...STATIC_COLLECTIONS];
  }
}

export async function getCollectionsForAdmin() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured.");
  }
  return prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getShopProductsByCollection() {
  if (!isDatabaseConfigured()) {
    return getStaticShopProductsByCollection();
  }

  try {
    const prisma = getPrisma();
    if (!prisma) return getStaticShopProductsByCollection();

    const collections = await prisma.collection.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { active: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return collections.filter((collection) => collection.products.length > 0);
  } catch (err) {
    logDbFallback("getShopProductsByCollection", err);
    return getStaticShopProductsByCollection();
  }
}

export async function getCarouselProducts() {
  if (!isDatabaseConfigured()) {
    return getStaticCarouselProducts();
  }

  try {
    const prisma = getPrisma();
    if (!prisma) return getStaticCarouselProducts();

    return await prisma.product.findMany({
      where: { active: true, featuredCarousel: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    logDbFallback("getCarouselProducts", err);
    return getStaticCarouselProducts();
  }
}
