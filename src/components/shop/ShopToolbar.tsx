"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { localizeCollectionName } from "@/lib/collections";
import type { ShopCollection, ShopPriceRange, ShopSortOption } from "@/lib/shop/filters";
import { SHOP_SORT_OPTIONS } from "@/lib/shop/filters";
import ShopFiltersPanel from "./ShopFiltersPanel";

type Props = {
  collections: ShopCollection[];
  collectionSlug: string | null;
  priceRange: ShopPriceRange | null;
  sort: ShopSortOption;
  resultCount: number;
  locale: string;
  onCollectionChange: (slug: string | null) => void;
  onPriceRangeChange: (range: ShopPriceRange | null) => void;
  onSortChange: (sort: ShopSortOption) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

function SortIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M3 7h12M3 12h8M3 17h4" strokeLinecap="round" />
      <path d="m18 5 3 3-3 3M21 8H15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ShopToolbar({
  collections,
  collectionSlug,
  priceRange,
  sort,
  resultCount,
  locale,
  onCollectionChange,
  onPriceRangeChange,
  onSortChange,
  onClear,
  hasActiveFilters,
}: Props) {
  const t = useTranslations("Shop");
  const [sortOpen, setSortOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <>
      <div className="sticky top-[4.5rem] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 bg-void/90 backdrop-blur-md border-y border-gold-glow/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-ivory-muted tracking-wide">
            {t("resultCount", { count: resultCount })}
          </p>

          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.15em] border border-gold-glow/25 rounded-sm text-ivory hover:border-gold/40 hover:text-gold transition-colors duration-200 cursor-pointer"
              aria-expanded={drawerOpen}
            >
              <FilterIcon />
              {t("filters")}
              {hasActiveFilters ? (
                <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />
              ) : null}
            </button>

            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                className="inline-flex items-center gap-2 px-3 py-2 min-w-[9.5rem] justify-between text-xs uppercase tracking-[0.15em] border border-gold-glow/25 rounded-sm text-ivory hover:border-gold/40 hover:text-gold transition-colors duration-200 cursor-pointer"
                aria-expanded={sortOpen}
                aria-haspopup="listbox"
              >
                <span className="inline-flex items-center gap-2">
                  <SortIcon />
                  {t(`sort.${sort}`)}
                </span>
                <ChevronIcon open={sortOpen} />
              </button>

              {sortOpen ? (
                <ul
                  role="listbox"
                  aria-label={t("sortLabel")}
                  className="absolute end-0 mt-2 w-52 py-1 bg-surface border border-gold-glow/20 rounded-sm shadow-lg z-40"
                >
                  {SHOP_SORT_OPTIONS.map((option) => (
                    <li key={option} role="option" aria-selected={sort === option}>
                      <button
                        type="button"
                        onClick={() => {
                          onSortChange(option);
                          setSortOpen(false);
                        }}
                        className={`w-full text-start px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                          sort === option
                            ? "text-gold bg-gold/10"
                            : "text-ivory-muted hover:text-ivory hover:bg-surface-2/80"
                        }`}
                      >
                        {t(`sort.${option}`)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
          <button
            type="button"
            onClick={() => onCollectionChange(null)}
            className={`shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] rounded-full border transition-colors duration-200 cursor-pointer ${
              collectionSlug === null
                ? "border-gold/50 text-gold bg-gold/10"
                : "border-gold-glow/20 text-ivory-muted hover:border-gold/30"
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
                onClick={() => onCollectionChange(active ? null : collection.slug)}
                className={`shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] rounded-full border transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  active
                    ? "border-gold/50 text-gold bg-gold/10"
                    : "border-gold-glow/20 text-ivory-muted hover:border-gold/30"
                }`}
              >
                {localizeCollectionName(collection, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-void/80 backdrop-blur-sm cursor-pointer"
            aria-label={t("closeFilters")}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-obsidian border-t border-gold-glow/20 rounded-t-lg p-6 pb-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("filters")}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-ivory">{t("filters")}</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-xs uppercase tracking-[0.2em] text-ivory-muted hover:text-gold transition-colors cursor-pointer"
              >
                {t("closeFilters")}
              </button>
            </div>
            <ShopFiltersPanel
              collections={collections}
              collectionSlug={collectionSlug}
              priceRange={priceRange}
              locale={locale}
              onCollectionChange={onCollectionChange}
              onPriceRangeChange={onPriceRangeChange}
              onClear={() => {
                onClear();
                setDrawerOpen(false);
              }}
              showClear={hasActiveFilters}
              idPrefix="drawer"
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-8 w-full py-3 bg-gold text-void text-xs font-semibold uppercase tracking-[0.2em] rounded-sm hover:bg-gold-muted transition-colors cursor-pointer"
            >
              {t("applyFilters")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
