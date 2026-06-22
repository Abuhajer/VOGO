"use client";

import { useTranslations } from "next-intl";
import { localizeCollectionName } from "@/lib/collections";
import type { ShopCollection, ShopPriceRange } from "@/lib/shop/filters";
import { SHOP_PRICE_RANGES } from "@/lib/shop/filters";

type Props = {
  collections: ShopCollection[];
  collectionSlug: string | null;
  priceRange: ShopPriceRange | null;
  locale: string;
  onCollectionChange: (slug: string | null) => void;
  onPriceRangeChange: (range: ShopPriceRange | null) => void;
  onClear: () => void;
  showClear: boolean;
  idPrefix?: string;
};

export default function ShopFiltersPanel({
  collections,
  collectionSlug,
  priceRange,
  locale,
  onCollectionChange,
  onPriceRangeChange,
  onClear,
  showClear,
  idPrefix = "shop",
}: Props) {
  const t = useTranslations("Shop");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
          {t("filterCollection")}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onCollectionChange(null)}
            className={`text-start px-3 py-2 rounded-sm text-sm transition-colors duration-200 cursor-pointer ${
              collectionSlug === null
                ? "bg-gold/10 text-gold border border-gold/30"
                : "text-ivory-muted hover:text-ivory hover:bg-surface-2/60 border border-transparent"
            }`}
          >
            {t("filterAllCollections")}
          </button>
          {collections.map((collection) => {
            const active = collectionSlug === collection.slug;
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => onCollectionChange(collection.slug)}
                className={`text-start px-3 py-2 rounded-sm text-sm transition-colors duration-200 cursor-pointer ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/30"
                    : "text-ivory-muted hover:text-ivory hover:bg-surface-2/60 border border-transparent"
                }`}
              >
                {localizeCollectionName(collection, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
          {t("filterPrice")}
        </p>
        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label={t("filterPrice")}
        >
          <button
            type="button"
            role="radio"
            aria-checked={priceRange === null}
            onClick={() => onPriceRangeChange(null)}
            className={`text-start px-3 py-2 rounded-sm text-sm transition-colors duration-200 cursor-pointer ${
              priceRange === null
                ? "bg-gold/10 text-gold border border-gold/30"
                : "text-ivory-muted hover:text-ivory hover:bg-surface-2/60 border border-transparent"
            }`}
          >
            {t("filterAllPrices")}
          </button>
          {SHOP_PRICE_RANGES.map((range) => {
            const active = priceRange === range;
            const inputId = `${idPrefix}-price-${range}`;
            return (
              <button
                key={range}
                id={inputId}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onPriceRangeChange(range)}
                className={`text-start px-3 py-2 rounded-sm text-sm transition-colors duration-200 cursor-pointer ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/30"
                    : "text-ivory-muted hover:text-ivory hover:bg-surface-2/60 border border-transparent"
                }`}
              >
                {t(`priceRange.${range}`)}
              </button>
            );
          })}
        </div>
      </div>

      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="w-full px-3 py-2.5 text-xs uppercase tracking-[0.2em] text-ivory-muted border border-gold-glow/20 rounded-sm hover:text-gold hover:border-gold/40 transition-colors duration-200 cursor-pointer"
        >
          {t("clearFilters")}
        </button>
      ) : null}
    </div>
  );
}
