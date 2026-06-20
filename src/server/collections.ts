import { prisma } from "@/lib/db";

export type CollectionSummary = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
};

export async function getActiveCollections() {
  return prisma.collection.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCollectionsForAdmin() {
  return prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getShopProductsByCollection() {
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
}

export async function getCarouselProducts() {
  return prisma.product.findMany({
    where: { active: true, featuredCarousel: true },
    orderBy: { createdAt: "asc" },
  });
}
