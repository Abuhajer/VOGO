"use server";

import { getPrisma } from "@/lib/db";
import { getStaticProductBySlug } from "@/lib/catalog/static-catalog";
import { resolveProductPricing } from "@/lib/pricing";
import { getPromotionRecords } from "@/server/promotions";

/** Returns current sale-aware unit prices keyed by product slug. */
export async function refreshCartItemPrices(
  slugs: string[]
): Promise<Record<string, number>> {
  const uniqueSlugs = Array.from(new Set(slugs));
  if (uniqueSlugs.length === 0) return {};

  const prisma = getPrisma();
  const promotions = await getPromotionRecords();
  const priceMap: Record<string, number> = {};

  if (prisma) {
    const products = await prisma.product.findMany({
      where: { slug: { in: uniqueSlugs }, active: true },
      select: { slug: true, id: true, price: true, collectionId: true },
    });

    for (const product of products) {
      const pricing = resolveProductPricing(
        { id: product.id, price: product.price, collectionId: product.collectionId },
        promotions
      );
      priceMap[product.slug] = pricing.salePrice;
    }
    return priceMap;
  }

  for (const slug of uniqueSlugs) {
    const product = getStaticProductBySlug(slug);
    if (!product) continue;
    const pricing = resolveProductPricing(
      { id: product.id, price: product.price, collectionId: product.collectionId ?? null },
      promotions
    );
    priceMap[slug] = pricing.salePrice;
  }

  return priceMap;
}
