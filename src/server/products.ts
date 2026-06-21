import { getStaticProductBySlug } from "@/lib/catalog/static-catalog";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

function logDbFallback(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[products] ${context}: database unavailable — using static catalog (${message})`);
}

export async function getActiveProducts() {
  const prisma = getPrisma();
  if (!prisma) {
    const { STATIC_PRODUCTS } = await import("@/lib/catalog/static-catalog");
    return STATIC_PRODUCTS.map((p) => ({
      id: p.slug,
      slug: p.slug,
      sku: p.sku,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descAr: p.descAr,
      descEn: p.descEn,
      price: p.price,
      imageSrc: p.imageSrc,
      active: true,
      featuredCarousel: p.featuredCarousel,
      collectionId: p.collectionSlug,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }));
  }

  return prisma.product.findMany({
    where: { active: true },
    include: { collection: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProductBySlug(slug: string) {
  if (!isDatabaseConfigured()) {
    return getStaticProductBySlug(slug);
  }

  try {
    const prisma = getPrisma();
    if (!prisma) return getStaticProductBySlug(slug);

    const product = await prisma.product.findFirst({
      where: { slug, active: true },
      include: { collection: true },
    });
    if (product) return product;
  } catch (err) {
    logDbFallback("getProductBySlug", err);
  }

  return getStaticProductBySlug(slug);
}

export { localizeProduct } from "@/lib/products";
