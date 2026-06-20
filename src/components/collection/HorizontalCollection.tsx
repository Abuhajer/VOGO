"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import CoverflowCarousel3D from "@/components/carousel/CoverflowCarousel3D";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import SectionLabel from "@/components/icons/SectionLabel";
import { localizeProduct } from "@/lib/products";
import { formatNumber } from "@/lib/format";
import type { CollectionCarouselProduct } from "@/types/catalog";

type HorizontalCollectionProps = {
  products: CollectionCarouselProduct[];
};

type SelectedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageSrc: string;
};

function CollectionCoverflowSlide({
  product,
  locale,
  isCenter,
  viewLabel,
  onOpenDetails,
  onActivate,
  index,
}: {
  product: CollectionCarouselProduct;
  locale: string;
  isCenter: boolean;
  viewLabel: string;
  onOpenDetails: () => void;
  onActivate: () => void;
  index: number;
}) {
  const { name } = localizeProduct(product, locale);

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
          ? "coverflow-carousel-card border-gold shadow-[0_0_20px_rgba(201,168,76,0.28)] ring-1 ring-gold/45"
          : "coverflow-carousel-card border-gold-glow/15 hover:border-gold/35"
      }`}
    >
      <div className="relative h-full w-full bg-obsidian">
        <Image
          src={product.imageSrc}
          alt={name}
          fill
          quality={index < 2 ? 85 : 78}
          sizes="(max-width: 640px) 70vw, 420px"
          priority={index < 2}
          loading={index < 3 ? "eager" : "lazy"}
          fetchPriority={index < 2 ? "high" : "low"}
          className="object-contain object-center p-1.5"
        />
      </div>
    </button>
  );
}

function CollectionCarouselMeta({
  product,
  locale,
  isAr,
  viewLabel,
  currencyLabel,
  onOpenDetails,
}: {
  product: CollectionCarouselProduct;
  locale: string;
  isAr: boolean;
  viewLabel: string;
  currencyLabel: string;
  onOpenDetails: () => void;
}) {
  const { name } = localizeProduct(product, locale);

  return (
    <div
      className="collection-coverflow-meta relative z-20 mx-auto w-full max-w-lg px-4 sm:px-6"
      dir={isAr ? "rtl" : "ltr"}
    >
      <h3 className="font-serif text-lg leading-snug text-ivory sm:text-xl md:text-2xl">{name}</h3>
      <p className="mt-2 text-sm tabular-nums text-gold sm:mt-2.5 sm:text-base">
        {formatNumber(product.price, locale)} {currencyLabel}
      </p>
      <div className="mt-5 flex justify-center sm:mt-6">
        <button
          type="button"
          onClick={onOpenDetails}
          className={`inline-flex min-h-[44px] min-w-[9.5rem] items-center justify-center rounded-sm border border-gold/40 bg-surface/80 px-6 py-2.5 text-[10px] font-semibold text-gold transition-colors hover:border-gold/60 hover:bg-surface sm:text-[11px] ${
            isAr ? "" : "uppercase tracking-[0.12em]"
          }`}
        >
          {viewLabel}
        </button>
      </div>
    </div>
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
                  name,
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
        name,
        description,
        price: product.price,
        imageSrc: product.imageSrc,
      });
    },
    [locale, openProductDetails]
  );

  const activeProduct = products[activeIndex] ?? null;

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
              className="collection-coverflow-carousel relative mx-auto w-full max-w-6xl"
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
              renderSlide={({ item, index, isCenter, onActivate }) => (
                <CollectionCoverflowSlide
                  product={item}
                  locale={locale}
                  isCenter={isCenter}
                  viewLabel={t("view")}
                  onOpenDetails={() => openFromProduct(item)}
                  onActivate={onActivate}
                  index={index}
                />
              )}
            />
            {activeProduct ? (
              <CollectionCarouselMeta
                product={activeProduct}
                locale={locale}
                isAr={isAr}
                viewLabel={t("view")}
                currencyLabel={t("currency")}
                onOpenDetails={() => openFromProduct(activeProduct)}
              />
            ) : null}
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
      />
    </>
  );
}
