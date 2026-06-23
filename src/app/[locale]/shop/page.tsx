import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStaticShopProductsByCollection } from "@/lib/catalog/static-catalog";
import { getShopCatalog } from "@/server/collections";
import ShopCatalog from "@/components/shop/ShopCatalog";
import PageShell from "@/components/layout/PageShell";
import type { ShopProduct } from "@/lib/shop/filters";
import type { CollectionSummary } from "@/server/collections";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Shop" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

function ShopCatalogFallback() {
  return (
    <div className="mt-14 animate-pulse space-y-8">
      <div className="h-10 w-48 bg-surface rounded-sm" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="aspect-[3/4] bg-surface rounded-sm" />
        ))}
      </div>
    </div>
  );
}

export default async function ShopPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  let catalog: { collections: CollectionSummary[]; products: ShopProduct[] };

  try {
    catalog = await getShopCatalog();
  } catch (err) {
    console.error("[shop] catalog load failed", err);
    const grouped = getStaticShopProductsByCollection();
    catalog = {
      collections: grouped.map((collection) => ({
        id: collection.id,
        slug: collection.slug,
        nameAr: collection.nameAr,
        nameEn: collection.nameEn,
        sortOrder: collection.sortOrder,
      })),
      products: grouped.flatMap((collection) =>
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
      ) satisfies ShopProduct[],
    };
  }

  return (
    <PageShell dir={locale === "ar" ? "rtl" : "ltr"}>
      <Suspense fallback={<ShopCatalogFallback />}>
        <ShopCatalog
          collections={catalog.collections}
          products={catalog.products}
        />
      </Suspense>
    </PageShell>
  );
}
