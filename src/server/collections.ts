import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { enrichShopProducts } from "@/server/promotions";
import {
  getStaticCarouselProducts,
  getStaticShopProductsByCollection,
  STATIC_COLLECTIONS,
} from "@/lib/catalog/static-catalog";
import type { ShopProduct } from "@/lib/shop/filters";

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

export async function getShopCatalog(): Promise<{
  collections: CollectionSummary[];
  products: ShopProduct[];
}> {
  const grouped = await getShopProductsByCollection();

  const collections: CollectionSummary[] = grouped.map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    nameAr: collection.nameAr,
    nameEn: collection.nameEn,
    sortOrder: collection.sortOrder,
  }));

  const products: ShopProduct[] = grouped.flatMap((collection) =>
    collection.products.map((product) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descAr: product.descAr,
      descEn: product.descEn,
      price: product.price,
      imageSrc: product.imageSrc,
      active: product.active,
      featuredCarousel: product.featuredCarousel,
      collectionId: product.collectionId,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      collection: {
        id: collection.id,
        slug: collection.slug,
        nameAr: collection.nameAr,
        nameEn: collection.nameEn,
      },
    }))
  );

  return { collections, products: await enrichShopProducts(products) };
}


export async function getCarouselProducts() {
  if (!isDatabaseConfigured()) {
    return getStaticCarouselProducts();
  }

  try {
    const prisma = getPrisma();
    if (!prisma) return getStaticCarouselProducts();

    const raw = await prisma.product.findMany({
      where: { active: true, featuredCarousel: true },
      orderBy: { createdAt: "asc" },
      include: { collection: true },
    });

    const products: ShopProduct[] = raw.map((product) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descAr: product.descAr,
      descEn: product.descEn,
      price: product.price,
      imageSrc: product.imageSrc,
      active: product.active,
      featuredCarousel: product.featuredCarousel,
      collectionId: product.collectionId,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      collection: product.collection
        ? {
            id: product.collection.id,
            slug: product.collection.slug,
            nameAr: product.collection.nameAr,
            nameEn: product.collection.nameEn,
          }
        : {
            id: "",
            slug: "general",
            nameAr: "عام",
            nameEn: "General",
          },
    }));

    return await enrichShopProducts(products);
  } catch (err) {
    logDbFallback("getCarouselProducts", err);
    return getStaticCarouselProducts();
  }
}
