"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { localizeProduct } from "@/lib/products";
import { localizeCollectionName } from "@/lib/collections";
import PriceDisplay from "@/components/shop/PriceDisplay";
import ShopSaleBadge from "@/components/shop/ShopSaleBadge";

type Product = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  salePrice?: number;
  saleBadgeEn?: string;
  saleBadgeAr?: string;
  imageSrc: string;
  collection?: { nameAr: string; nameEn: string } | null;
};

export default function ShopProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations("Shop");
  const { name } = localizeProduct(product, locale);
  const saleBadge =
    locale === "ar"
      ? product.saleBadgeAr ?? product.saleBadgeEn
      : product.saleBadgeEn ?? product.saleBadgeAr;

  return (
    <article className="group flex h-full flex-col">
      <div className="shop-product-card relative flex aspect-[3/4] flex-col overflow-hidden rounded-sm border border-gold-glow/10 bg-[#0E0D12]">
        <Link
          href={`/shop/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={name}
        >
          <Image
            src={product.imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-fabric group-hover:scale-[1.04]"
          />
        </Link>

        <div
          className="shop-product-card-scrim pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050508]/94 via-[#050508]/38 to-transparent"
          aria-hidden
        />

        <ShopSaleBadge
          badge={saleBadge}
          price={product.price}
          salePrice={product.salePrice}
          locale={locale}
        />

        {product.collection ? (
          <div className="pointer-events-none absolute top-2.5 end-2.5 z-10 max-w-[58%] sm:top-3 sm:end-3">
            <p className="shop-product-card-chip pointer-events-auto inline-block max-w-full truncate rounded-sm px-2 py-1 text-[9px] uppercase tracking-[0.14em] backdrop-blur-[2px]">
              {localizeCollectionName(product.collection, locale)}
            </p>
          </div>
        ) : null}

        <div className="shop-product-card-footer relative z-10 mt-auto w-full">
          <div className="shop-product-card-footer-panel bg-gradient-to-t from-[#050508]/92 via-[#050508]/55 to-transparent px-3 pb-3 pt-8 sm:px-3.5 sm:pb-3.5 sm:pt-9">
            <h3
              className="shop-product-card-title min-h-[2.5rem] text-start font-serif text-sm leading-[1.35] line-clamp-2 sm:min-h-[2.75rem] sm:text-[0.95rem] sm:leading-[1.4]"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <Link href={`/shop/${product.slug}`} className="transition-colors duration-200 hover:text-gold">
                {name}
              </Link>
            </h3>

            <div className="shop-product-card-price-row mt-1.5 min-h-[1.35rem]">
              <PriceDisplay
                price={product.price}
                salePrice={product.salePrice}
                locale={locale}
                size="sm"
                surface="on-image"
              />
            </div>

            <div className="shop-product-card-actions mt-2.5 flex min-h-[1.875rem] items-center gap-1.5 opacity-100 transition-opacity duration-200 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <Link
                href={`/shop/${product.slug}`}
                className="inline-flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-sm bg-gold px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0E0D12] transition-colors duration-200 hover:bg-gold-muted sm:px-2.5 sm:text-[10px] sm:tracking-[0.1em]"
              >
                {t("selectSizeCta")}
              </Link>
              <Link
                href={`/shop/${product.slug}`}
                className="shop-product-card-secondary inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm border px-2 py-1.5 text-[10px] uppercase tracking-[0.1em] transition-colors duration-200 sm:px-2.5 sm:text-[10px]"
              >
                {t("viewPiece")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
