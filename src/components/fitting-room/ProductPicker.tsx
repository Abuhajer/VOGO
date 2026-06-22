"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import CoverflowCarousel3D from "@/components/carousel/CoverflowCarousel3D";
import ProductDetailModal from "@/components/collection/ProductDetailModal";
import { localizeProduct } from "@/lib/products";
import { formatNumber } from "@/lib/format";
import Button from "@/components/ui/Button";
import FittingRoomStepIntro from "./FittingRoomStepIntro";
import type { FittingRoomProduct } from "@/lib/try-on/types";

type Props = {
  products: FittingRoomProduct[];
  selectedId: string | null;
  onSelect: (product: FittingRoomProduct) => void;
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
};

type DetailProduct = {
  name: string;
  description: string;
  price: number;
  imageSrc: string;
};

function ProductCardFace({
  product,
  selected,
  locale,
  isAr,
  selectedLabel,
  onSelect,
  className = "",
  imageOnly = false,
  fitContain = true,
  isCenter,
  viewDetailsLabel,
  onOpenDetails,
  onActivate,
  slideIndex,
  slideTotal,
}: {
  product: FittingRoomProduct;
  selected: boolean;
  locale: string;
  isAr: boolean;
  selectedLabel: string;
  onSelect: (product: FittingRoomProduct) => void;
  className?: string;
  imageOnly?: boolean;
  fitContain?: boolean;
  isCenter?: boolean;
  viewDetailsLabel?: string;
  onOpenDetails?: () => void;
  onActivate?: () => void;
  slideIndex?: number;
  slideTotal?: number;
}) {
  const { name } = localizeProduct(product, locale);
  const showCenterOverlay = imageOnly && isCenter;

  const handleClick = () => {
    if (imageOnly && isCenter !== undefined) {
      if (isCenter && onOpenDetails) onOpenDetails();
      else if (onActivate) onActivate();
      return;
    }
    onSelect(product);
  };

  return (
    <button
      type="button"
      data-carousel-card={showCenterOverlay ? "" : undefined}
      onClick={handleClick}
      aria-label={showCenterOverlay && viewDetailsLabel ? viewDetailsLabel : name}
      className={`group flex flex-col overflow-hidden rounded-sm border text-start transition-[border-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] ${
        selected
          ? "border-gold shadow-[0_0_20px_rgba(201,168,76,0.28)] ring-1 ring-gold/45"
          : "border-gold-glow/15 hover:border-gold/35"
      } ${className}`}
    >
      <div
        className={`relative min-h-0 bg-obsidian ${
          imageOnly ? "h-full w-full" : "aspect-[3/4] w-full shrink-0"
        }`}
      >
        <div
          className={
            showCenterOverlay
              ? "absolute inset-0 bottom-[38%] sm:bottom-0"
              : "absolute inset-0"
          }
        >
          <Image
            src={product.imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 180px, 240px"
            loading="lazy"
            className={
              fitContain
                ? "carousel-product-image object-contain object-top sm:object-center"
                : "object-cover object-center"
            }
          />
        </div>
        {selected && !showCenterOverlay ? (
          <span className="absolute end-1.5 top-1.5 z-20 rounded-sm border border-gold/30 bg-void/85 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-gold">
            {selectedLabel}
          </span>
        ) : null}
        {showCenterOverlay ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-void via-void/88 to-transparent sm:h-[46%]"
              aria-hidden
            />
            <div
              className="fitting-room-card-overlay absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end px-2.5 pb-2.5 pt-6 text-center sm:px-4 sm:pb-3 sm:pt-10"
              dir={isAr ? "rtl" : "ltr"}
            >
              {selected ? (
                <span className="mb-1.5 inline-flex items-center rounded-sm border border-gold/35 bg-void/75 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.14em] text-gold backdrop-blur-sm sm:mb-2 sm:text-[8px]">
                  {selectedLabel}
                </span>
              ) : null}
              <p className="line-clamp-2 max-w-[94%] font-serif text-[11px] leading-snug text-ivory sm:max-w-[92%] sm:text-[11px]">
                {name}
              </p>
              <p className="mt-1.5 text-[10px] tabular-nums text-gold sm:mt-2 sm:text-[10px]">
                {formatNumber(product.price, locale)} {isAr ? "د.أ" : "JOD"}
              </p>
              {viewDetailsLabel ? (
                <span
                  className={`mt-2 inline-flex min-h-9 items-center justify-center rounded-sm border border-gold/40 bg-void/70 px-3 py-1.5 text-[9px] font-semibold text-gold backdrop-blur-[2px] sm:mt-2.5 sm:min-h-0 sm:px-3 sm:py-1 sm:text-[9px] ${
                    isAr ? "" : "uppercase tracking-[0.1em]"
                  }`}
                >
                  {viewDetailsLabel}
                </span>
              ) : null}
              {slideIndex !== undefined && slideTotal !== undefined && slideTotal > 0 ? (
                <p
                  className="mt-1.5 text-[8px] tabular-nums tracking-[0.12em] text-ivory-faint/80 sm:mt-2 sm:text-[8px]"
                  dir="ltr"
                >
                  {formatNumber(slideIndex + 1, locale)} / {formatNumber(slideTotal, locale)}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      {!imageOnly ? (
        <div className="border-t border-gold-glow/10 bg-surface/80 p-2 sm:p-2.5">
          <p className="line-clamp-2 font-serif text-[11px] leading-tight text-ivory sm:text-xs">{name}</p>
          <p className="mt-1 text-[10px] tabular-nums text-gold sm:text-[11px]">
            {formatNumber(product.price, locale)} {isAr ? "د.أ" : "JOD"}
          </p>
        </div>
      ) : null}
    </button>
  );
}

function FlatProductStrip({
  products,
  selectedId,
  locale,
  isAr,
  selectedLabel,
  onSelect,
  onOpenDetails,
}: {
  products: FittingRoomProduct[];
  selectedId: string | null;
  locale: string;
  isAr: boolean;
  selectedLabel: string;
  onSelect: (product: FittingRoomProduct) => void;
  onOpenDetails: (product: FittingRoomProduct) => void;
}) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-ps-1 scroll-pe-[max(0.25rem,env(safe-area-inset-right))] scrollbar-hide sm:gap-3"
      dir={isAr ? "rtl" : "ltr"}
    >
      {products.map((product) => (
        <ProductCardFace
          key={product.id}
          product={product}
          selected={selectedId === product.id}
          locale={locale}
          isAr={isAr}
          selectedLabel={selectedLabel}
          onSelect={(item) => {
            onSelect(item);
            onOpenDetails(item);
          }}
          className="w-[132px] min-w-[132px] shrink-0 snap-start sm:w-[148px] sm:min-w-[148px] md:w-[160px] md:min-w-[160px]"
        />
      ))}
    </div>
  );
}

function ProductCarousel3D({
  products,
  selectedId,
  locale,
  isAr,
  selectedLabel,
  viewDetailsLabel,
  onSelect,
  onOpenDetails,
}: {
  products: FittingRoomProduct[];
  selectedId: string | null;
  locale: string;
  isAr: boolean;
  selectedLabel: string;
  viewDetailsLabel: string;
  onSelect: (product: FittingRoomProduct) => void;
  onOpenDetails: (product: FittingRoomProduct) => void;
}) {
  const t = useTranslations("FittingRoom");

  const selectedIndex = useMemo(() => {
    const idx = products.findIndex((p) => p.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [products, selectedId]);

  const handleIndexChange = useCallback(
    (index: number) => {
      const product = products[index];
      if (product) onSelect(product);
    },
    [products, onSelect]
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <CoverflowCarousel3D
        variant="fitting-room"
        className="relative flex min-h-0 w-full flex-1 flex-col"
        items={products}
        activeIndex={selectedIndex}
        onActiveIndexChange={handleIndexChange}
        isRtl={isAr}
        locale={locale}
        getItemKey={(product) => product.id}
        getItemLabel={(product) => localizeProduct(product, locale).name}
        isItemSelected={(product) => selectedId === product.id}
        ariaLabel={t("step1Title")}
        prevLabel={t("carouselPrev")}
        nextLabel={t("carouselNext")}
        showCounter={false}
        renderSlide={({ item, isSelected, isCenter, onActivate, index }) => (
          <ProductCardFace
            product={item}
            selected={isSelected}
            locale={locale}
            isAr={isAr}
            selectedLabel={selectedLabel}
            onSelect={onActivate}
            isCenter={isCenter}
            viewDetailsLabel={viewDetailsLabel}
            onOpenDetails={() => onOpenDetails(item)}
            onActivate={onActivate}
            slideIndex={isCenter ? index : undefined}
            slideTotal={isCenter ? products.length : undefined}
            imageOnly
            fitContain
            className="coverflow-carousel-card h-full w-full shadow-[0_16px_40px_rgba(0,0,0,0.45)] light:shadow-[0_12px_32px_rgba(14,13,18,0.12)]"
          />
        )}
      />
    </div>
  );
}

export default function ProductPicker({
  products,
  selectedId,
  onSelect,
  onContinue,
  canContinue = false,
  continueLabel,
}: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const prefersReducedMotion = useReducedMotion();
  const useCarousel3D = !prefersReducedMotion && products.length > 0;
  const showCarouselHint = useCarousel3D;
  const [detailProduct, setDetailProduct] = useState<DetailProduct | null>(null);
  const continueText = continueLabel ?? t("continue");

  const openProductDetails = useCallback(
    (product: FittingRoomProduct) => {
      const { name, description } = localizeProduct(product, locale);
      setDetailProduct({
        name,
        description,
        price: product.price,
        imageSrc: product.imageSrc,
      });
    },
    [locale]
  );

  const closeProductDetails = useCallback(() => setDetailProduct(null), []);

  if (products.length === 0) {
    return <p className="text-sm text-ivory-muted">{t("noProducts")}</p>;
  }

  const carousel = useCarousel3D ? (
    <ProductCarousel3D
      products={products}
      selectedId={selectedId}
      locale={locale}
      isAr={isAr}
      selectedLabel={t("selected")}
      viewDetailsLabel={t("viewDetails")}
      onSelect={onSelect}
      onOpenDetails={openProductDetails}
    />
  ) : (
    <FlatProductStrip
      products={products}
      selectedId={selectedId}
      locale={locale}
      isAr={isAr}
      selectedLabel={t("selected")}
      onSelect={onSelect}
      onOpenDetails={openProductDetails}
    />
  );

  const continueButton = onContinue ? (
    <Button
      variant="solid"
      disabled={!canContinue}
      onClick={onContinue}
      isArabic={isAr}
      className="!min-h-11 w-full !px-5 !py-2.5"
    >
      {continueText}
    </Button>
  ) : null;

  return (
    <>
      <div className="fitting-room-product-stage relative flex min-h-0 w-full flex-1 flex-col">
        <div className="shrink-0 px-2 pt-0.5 md:hidden" dir={isAr ? "rtl" : "ltr"}>
          <FittingRoomStepIntro
            step="product"
            variant="stacked"
            showCarouselHint={false}
          />
        </div>

        <div
          className="fitting-room-product-row relative mx-auto flex min-h-0 w-full max-w-full flex-1 items-stretch justify-center gap-2 px-1 py-1 sm:gap-3 sm:px-3 md:items-center md:gap-6 md:py-3 lg:gap-8"
          dir="ltr"
        >
          <div className="fitting-room-product-carousel relative mx-auto flex min-h-0 min-w-0 flex-1 flex-col">
            {carousel}
          </div>

          <aside
            className="fitting-room-product-sidebar hidden min-h-0 w-full max-w-[19rem] shrink-0 flex-col md:flex lg:max-w-[21rem]"
            dir={isAr ? "rtl" : "ltr"}
          >
            <FittingRoomStepIntro
              step="product"
              variant="sidebar"
              showCarouselHint={showCarouselHint}
            />

            {continueButton ? (
              <div className="mt-auto shrink-0 border-t border-gold-glow/10 pt-4">
                {continueButton}
              </div>
            ) : null}
          </aside>
        </div>

        {continueButton ? (
          <div
            className="shrink-0 border-t border-gold-glow/10 bg-surface/95 px-3 py-2.5 backdrop-blur-md md:hidden sm:px-4"
            dir={isAr ? "rtl" : "ltr"}
          >
            {continueButton}
          </div>
        ) : null}
      </div>

      <ProductDetailModal
        open={detailProduct !== null}
        onClose={closeProductDetails}
        name={detailProduct?.name ?? ""}
        description={detailProduct?.description ?? ""}
        price={detailProduct?.price ?? 0}
        imageSrc={detailProduct?.imageSrc ?? ""}
      />
    </>
  );
}
