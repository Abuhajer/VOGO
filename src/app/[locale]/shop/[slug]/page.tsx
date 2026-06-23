import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySlug } from "@/server/products";
import { getProductSalePricing } from "@/server/promotions";
import { localizeProduct } from "@/lib/products";
import { absoluteUrl } from "@/lib/site";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }

  const { name, description } = localizeProduct(product, locale);
  const title = `${name} | VOGO BY FAME`;
  const url = absoluteUrl(`/${locale}/shop/${slug}`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: absoluteUrl(product.imageSrc) }],
    },
  };
}

export default async function ProductPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const pricing = await getProductSalePricing({
    id: product.id,
    price: product.price,
    collectionId: product.collectionId ?? null,
  });

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        slug: product.slug,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        descAr: product.descAr,
        descEn: product.descEn,
        price: product.price,
        salePrice: pricing.onSale ? pricing.salePrice : undefined,
        saleBadgeEn: pricing.badgeEn ?? undefined,
        saleBadgeAr: pricing.badgeAr ?? undefined,
        imageSrc: product.imageSrc,
        sizeChartJson: "sizeChartJson" in product ? (product.sizeChartJson as string | null) : null,
        customSizeEnabled:
          "customSizeEnabled" in product ? Boolean(product.customSizeEnabled) : true,
        collection: product.collection
          ? {
              slug: product.collection.slug,
              nameAr: product.collection.nameAr,
              nameEn: product.collection.nameEn,
            }
          : null,
      }}
    />
  );
}
