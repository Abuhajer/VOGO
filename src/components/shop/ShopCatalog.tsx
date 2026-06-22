"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import SectionHeading from "@/components/ui/SectionHeading";
import ShopToolbar from "@/components/shop/ShopToolbar";
import ShopFiltersPanel from "@/components/shop/ShopFiltersPanel";
import ShopProductCard from "@/components/shop/ShopProductCard";
import {
  filterAndSortShopProducts,
  hasActiveShopFilters,
  parseShopCollection,
  parseShopPriceRange,
  parseShopSort,
  type ShopCollection,
  type ShopPriceRange,
  type ShopProduct,
  type ShopSortOption,
} from "@/lib/shop/filters";

type Props = {
  collections: ShopCollection[];
  products: ShopProduct[];
};

export default function ShopCatalog({ collections, products }: Props) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const collectionSlug = parseShopCollection(searchParams.get("collection"), collections);
  const priceRange = parseShopPriceRange(searchParams.get("price"));
  const sort = parseShopSort(searchParams.get("sort"));

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleCollectionChange = useCallback(
    (slug: string | null) => {
      updateParams({ collection: slug });
    },
    [updateParams]
  );

  const handlePriceRangeChange = useCallback(
    (range: ShopPriceRange | null) => {
      updateParams({ price: range });
    },
    [updateParams]
  );

  const handleSortChange = useCallback(
    (nextSort: ShopSortOption) => {
      updateParams({ sort: nextSort === "featured" ? null : nextSort });
    },
    [updateParams]
  );

  const handleClear = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const filteredProducts = useMemo(
    () =>
      filterAndSortShopProducts({
        products,
        collectionSlug,
        priceRange,
        sort,
        locale,
      }),
    [products, collectionSlug, priceRange, sort, locale]
  );

  const activeFilters = hasActiveShopFilters({ collectionSlug, priceRange, sort });

  return (
    <>
      <header className="max-w-3xl">
        <SectionHeading label={t("eyebrow")} title={t("title")} />
        <p className="mt-4 max-w-2xl text-ivory-muted font-light leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      <div className="mt-10">
        <ShopToolbar
          collections={collections}
          collectionSlug={collectionSlug}
          priceRange={priceRange}
          sort={sort}
          resultCount={filteredProducts.length}
          locale={locale}
          onCollectionChange={handleCollectionChange}
          onPriceRangeChange={handlePriceRangeChange}
          onSortChange={handleSortChange}
          onClear={handleClear}
          hasActiveFilters={activeFilters}
        />

        <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-12">
          <aside className="hidden lg:block">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-6">
              {t("refineSelection")}
            </p>
            <ShopFiltersPanel
              collections={collections}
              collectionSlug={collectionSlug}
              priceRange={priceRange}
              locale={locale}
              onCollectionChange={handleCollectionChange}
              onPriceRangeChange={handlePriceRangeChange}
              onClear={handleClear}
              showClear={activeFilters}
              idPrefix="sidebar"
            />
          </aside>

          <div>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 md:py-28 text-center border border-gold-glow/10 rounded-sm bg-obsidian/40">
                <p className="font-serif text-2xl text-ivory">{t("emptyTitle")}</p>
                <p className="mt-3 max-w-md text-sm text-ivory-muted leading-relaxed">
                  {t("emptyDescription")}
                </p>
                {activeFilters ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="mt-8 px-6 py-3 text-xs uppercase tracking-[0.2em] border border-gold/40 text-gold rounded-sm hover:bg-gold/10 transition-colors duration-200 cursor-pointer"
                  >
                    {t("clearFilters")}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {filteredProducts.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
