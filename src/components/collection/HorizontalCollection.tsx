"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/context/ThemeProvider";
import CoverflowCarousel3D from "@/components/carousel/CoverflowCarousel3D";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import SectionLabel from "@/components/icons/SectionLabel";
import { localizeProduct } from "@/lib/products";
import { formatNumber } from "@/lib/format";
import PriceDisplay from "@/components/shop/PriceDisplay";
import type { CollectionCarouselProduct } from "@/types/catalog";

type HorizontalCollectionProps = {
  products: CollectionCarouselProduct[];
};

type SelectedProduct = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description: string;
  price: number;
  imageSrc: string;
};

function CollectionCoverflowSlide({
  product,
  locale,
  isAr,
  isCenter,
  viewLabel,
  onOpenDetails,
  onActivate,
  index,
  slideTotal,
}: {
  product: CollectionCarouselProduct;
  locale: string;
  isAr: boolean;
  isCenter: boolean;
  viewLabel: string;
  onOpenDetails: () => void;
  onActivate: () => void;
  index: number;
  slideTotal: number;
}) {
  const { name } = localizeProduct(product, locale);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const priceSurface = isLight ? "default" : "on-image";

  return (
    <button
      type="button"
      data-carousel-card={isCenter ? "" : undefined}
      onClick={() => {
        if (isCenter) onOpenDetails();
        else onActivate();
      }}
      aria-label={isCenter ? `${viewLabel} — ${name}` : name}
      className={`group relative h-full w-full overflow-hidden rounded-sm border text-start transition-[border-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] ${
        isCenter
          ? "coverflow-carousel-card border-gold shadow-[0_0_20px_rgba(201,168,76,0.28)] ring-1 ring-gold/45 light:shadow-[0_0_20px_rgba(179,142,54,0.16)]"
          : "coverflow-carousel-card border-gold-glow/15 hover:border-gold/35 light:border-[#0E0D12]/10 light:hover:border-gold/35"
      }`}
    >
      <div className="collection-coverflow-slide-inner relative h-full w-full bg-obsidian">
        <div
          className={
            isCenter
              ? "collection-card-image-wrap absolute inset-0 bottom-[36%] sm:bottom-[34%]"
              : "absolute inset-0"
          }
        >
          <Image
            src={product.imageSrc}
            alt={name}
            fill
            quality={index < 2 ? 85 : 78}
            sizes="(max-width: 640px) 180px, 240px"
            priority={index < 2}
            loading={index < 3 ? "eager" : "lazy"}
            fetchPriority={index < 2 ? "high" : "low"}
            className="carousel-product-image object-contain object-center"
          />
        </div>
        {isCenter ? (
          <>
            <div
              className="collection-card-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-void via-void/62 to-transparent sm:h-[60%]"
              aria-hidden
            />
            <div
              className="collection-card-panel collection-coverflow-overlay absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end gap-1 px-3 pb-2 pt-6 text-center sm:gap-1.5 sm:px-4 sm:pb-2.5 sm:pt-8"
              dir={isAr ? "rtl" : "ltr"}
            >
              <h3 className="carousel-card-title shrink-0 max-w-[94%] line-clamp-2">
                {name}
              </h3>
              <div className="collection-card-price mt-0.5 shrink-0 sm:mt-1">
                <PriceDisplay
                  price={product.price}
                  salePrice={product.salePrice}
                  locale={locale}
                  size="sm"
                  surface={priceSurface}
                  className="justify-center"
                />
              </div>
              <span
                className={`carousel-card-cta mt-2 shrink-0 inline-flex items-center rounded-sm border px-2.5 py-1 text-[8px] font-semibold backdrop-blur-[2px] sm:mt-2.5 sm:px-3 sm:py-1 sm:text-[9px] ${
                  isAr ? "" : "uppercase tracking-[0.1em]"
                }`}
              >
                {viewLabel}
              </span>
              {slideTotal > 0 ? (
                <p className="carousel-card-counter mt-1.5 shrink-0 text-[7px] tabular-nums tracking-[0.18em] sm:mt-2 sm:text-[8px]">
                  {formatNumber(index + 1, locale)} / {formatNumber(slideTotal, locale)}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </button>
  );
}

function FlatCollectionStrip({
  products,
  locale,
  onOpenDetails,
}: {
  products: CollectionCarouselProduct[];
  locale: string;
  onOpenDetails: (product: SelectedProduct) => void;
}) {
  return (
    <div
      className="flex gap-4 overflow-x-auto pb-2 px-4 snap-x snap-mandatory scroll-ps-4 scroll-pe-[max(1rem,env(safe-area-inset-right))] scrollbar-hide sm:gap-6 sm:px-6 md:px-12"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {products.map((product, index) => {
        const { name, description } = localizeProduct(product, locale);
        return (
          <div key={product.id} className="w-[80vw] max-w-[300px] shrink-0 snap-center sm:w-[290px]">
            <ProductCard
              id={product.id}
              name={name}
              description={description}
              price={product.price}
              imageSrc={product.imageSrc}
              index={index}
              onOpenDetails={() =>
                onOpenDetails({
                  id: product.id,
                  slug: product.slug,
                  name,
                  nameAr: product.nameAr,
                  nameEn: product.nameEn,
                  description,
                  price: product.price,
                  imageSrc: product.imageSrc,
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

export default function HorizontalCollection({ products }: HorizontalCollectionProps) {
  const t = useTranslations("Collection");
  const locale = useLocale();
  const isAr = locale === "ar";
  const productCount = products.length;
  const prefersReducedMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  const useCarousel3D = !prefersReducedMotion && productCount > 0;

  const openProductDetails = useCallback((product: SelectedProduct) => {
    setSelectedProduct(product);
  }, []);

  const closeProductDetails = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const openFromProduct = useCallback(
    (product: CollectionCarouselProduct) => {
      const { name, description } = localizeProduct(product, locale);
      openProductDetails({
        id: product.id,
        slug: product.slug,
        name,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        description,
        price: product.price,
        imageSrc: product.imageSrc,
      });
    },
    [locale, openProductDetails]
  );

  const header = (
    <div
      className="relative z-10 mx-auto mb-4 max-w-7xl select-none px-4 sm:mb-6 sm:px-6 md:mb-8 md:px-12"
      dir={isAr ? "rtl" : "ltr"}
    >
      <SectionLabel className="mb-2 font-light text-gold">{t("title")}</SectionLabel>
      <h2 className="max-w-xl font-serif text-2xl font-light leading-tight text-ivory sm:text-3xl md:text-5xl">
        {t("subtitle")}
      </h2>
      {useCarousel3D && (
        <>
          <p className="mt-2 font-sans text-[11px] font-light leading-relaxed text-ivory-faint sm:mt-3 sm:text-xs md:hidden">
            {t("carouselHintMobile")}
          </p>
          <p className="mt-2 hidden font-sans text-[11px] font-light leading-relaxed text-ivory-faint sm:mt-3 sm:text-xs md:block">
            {t("carouselHint")}
          </p>
        </>
      )}
    </div>
  );

  if (productCount === 0) return null;

  return (
    <>
      <section className="relative w-full scroll-mt-24 bg-void py-10 sm:py-14 md:py-16" id="collection">
        {header}

        {!useCarousel3D ? (
          <FlatCollectionStrip products={products} locale={locale} onOpenDetails={openProductDetails} />
        ) : (
          <div
            className="collection-coverflow-stage relative mx-auto w-full max-w-[96rem] px-2 sm:px-4"
            dir="ltr"
          >
            <CoverflowCarousel3D
              variant="collection"
              className="collection-coverflow-carousel relative mx-auto w-full max-w-4xl"
              items={products}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              isRtl={isAr}
              locale={locale}
              getItemKey={(product) => product.id}
              getItemLabel={(product) => localizeProduct(product, locale).name}
              ariaLabel={t("title")}
              prevLabel={t("carouselPrev")}
              nextLabel={t("carouselNext")}
              showCounter={false}
              renderSlide={({ item, index, isCenter, onActivate }) => (
                <CollectionCoverflowSlide
                  product={item}
                  locale={locale}
                  isAr={isAr}
                  isCenter={isCenter}
                  viewLabel={t("view")}
                  onOpenDetails={() => openFromProduct(item)}
                  onActivate={onActivate}
                  index={index}
                  slideTotal={productCount}
                />
              )}
            />
          </div>
        )}
      </section>

      <ProductDetailModal
        open={selectedProduct !== null}
        onClose={closeProductDetails}
        name={selectedProduct?.name ?? ""}
        description={selectedProduct?.description ?? ""}
        price={selectedProduct?.price ?? 0}
        imageSrc={selectedProduct?.imageSrc ?? ""}
        slug={selectedProduct?.slug}
        nameAr={selectedProduct?.nameAr}
        nameEn={selectedProduct?.nameEn}
      />
    </>
  );
}
