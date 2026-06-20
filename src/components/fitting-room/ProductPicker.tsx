"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import CoverflowCarousel3D from "@/components/carousel/CoverflowCarousel3D";
import ProductDetailModal from "@/components/collection/ProductDetailModal";
import { localizeProduct } from "@/lib/products";
import { formatNumber } from "@/lib/format";
import type { FittingRoomProduct } from "@/lib/try-on/types";

type Props = {
  products: FittingRoomProduct[];
  selectedId: string | null;
  onSelect: (product: FittingRoomProduct) => void;
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
}) {
  const { name } = localizeProduct(product, locale);

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
      data-carousel-card={imageOnly && isCenter ? "" : undefined}
      onClick={handleClick}
      aria-label={imageOnly && isCenter && viewDetailsLabel ? viewDetailsLabel : name}
      className={`group flex flex-col overflow-hidden rounded-sm border text-start transition-[border-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] ${
        selected
          ? "border-gold shadow-[0_0_20px_rgba(201,168,76,0.28)] ring-1 ring-gold/45"
          : "border-gold-glow/15 hover:border-gold/35"
      } ${className}`}
    >
      <div
        className={`relative min-h-0 bg-obsidian ${
          imageOnly ? "w-full flex-1" : "aspect-[3/4] w-full shrink-0"
        }`}
      >
        <Image
          src={product.imageSrc}
          alt={name}
          fill
          sizes="(max-width: 640px) 180px, 240px"
          loading="lazy"
          className={fitContain ? "object-contain object-center p-1.5" : "object-cover object-center"}
        />
        {selected ? (
          <span className="absolute end-1.5 top-1.5 rounded-sm border border-gold/30 bg-void/85 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-gold">
            {selectedLabel}
          </span>
        ) : null}
      </div>
      {imageOnly && isCenter && viewDetailsLabel ? (
        <span
          className={`shrink-0 border-t border-gold/30 bg-surface/90 px-2 py-2 text-center text-[9px] font-semibold text-gold sm:py-2.5 sm:text-[10px] ${
            isAr ? "" : "uppercase tracking-[0.1em]"
          }`}
        >
          {viewDetailsLabel}
        </span>
      ) : null}
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

  const activeProduct = products[selectedIndex];
  const activeLocalized = activeProduct ? localizeProduct(activeProduct, locale) : null;

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
        renderSlide={({ item, isSelected, isCenter, onActivate }) => (
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
            imageOnly
            fitContain
            className="coverflow-carousel-card h-full w-full shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          />
        )}
        overlay={
          activeProduct && activeLocalized ? (
            <div
              className="pointer-events-none absolute bottom-10 inset-x-0 z-20 px-4 text-center sm:bottom-12"
              dir={isAr ? "rtl" : "ltr"}
            >
              <p className="font-serif text-base text-ivory sm:text-lg md:text-xl">{activeLocalized.name}</p>
              <p className="mt-0.5 text-xs tabular-nums text-gold sm:text-sm">
                {formatNumber(activeProduct.price, locale)} {isAr ? "د.أ" : "JOD"}
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
}

export default function ProductPicker({ products, selectedId, onSelect }: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const prefersReducedMotion = useReducedMotion();
  const useCarousel3D = !prefersReducedMotion && products.length > 0;
  const [detailProduct, setDetailProduct] = useState<DetailProduct | null>(null);

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

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {useCarousel3D ? (
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
        )}
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
