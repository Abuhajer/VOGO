import { getTranslations, setRequestLocale } from "next-intl/server";
import { localizeCollectionName } from "@/lib/collections";
import { getStaticShopProductsByCollection } from "@/lib/catalog/static-catalog";
import { getShopProductsByCollection } from "@/server/collections";
import ShopProductCard from "@/components/shop/ShopProductCard";
import SectionHeading from "@/components/ui/SectionHeading";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Shop" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ShopPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Shop");
  let grouped;

  try {
    grouped = await getShopProductsByCollection();
  } catch (err) {
    console.error("[shop] catalog load failed", err);
    grouped = getStaticShopProductsByCollection();
  }

  return (
    <main className="container mx-auto px-6 md:px-12 py-28 md:py-36" dir={locale === "ar" ? "rtl" : "ltr"}>
      <SectionHeading label={t("eyebrow")} title={t("title")} />
      <p className="mt-4 max-w-2xl text-ivory-muted font-light">{t("subtitle")}</p>

      <div className="mt-14 space-y-16">
        {grouped.map((collection) => (
          <section key={collection.id} id={collection.slug}>
            <div className="mb-8 border-b border-gold-glow/10 pb-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
                {t("collectionLabel")}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-ivory">
                {localizeCollectionName(collection, locale)}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {collection.products.map((product) => (
                <ShopProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
