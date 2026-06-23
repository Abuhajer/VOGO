"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { Link } from "@/i18n/routing";
import { useCart } from "@/context/CartProvider";
import { useAppToast } from "@/hooks/useAppToast";
import { localizeCollectionName } from "@/lib/collections";
import {
  buildCartLineId,
  defaultProductSizeChart,
  formatMeasurementRange,
  parseProductSizeChart,
  type CustomSizeFields,
  type StandardSize,
} from "@/lib/product-sizes";
import {
  defaultMannequinMeasurements,
  measurementsFromCustom,
  measurementsFromStandardSize,
  type MannequinHighlight,
  type MannequinMeasurements,
} from "@/lib/size-mannequin";
import PriceDisplay from "@/components/shop/PriceDisplay";
import SizeMannequin from "@/components/shop/SizeMannequin";

export type ProductDetailData = {
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
  sizeChartJson: string | null;
  customSizeEnabled: boolean;
  collection: {
    slug: string;
    nameAr: string;
    nameEn: string;
  } | null;
};

const DEFAULT_CUSTOM: CustomSizeFields = {
  chestCm: 96,
  waistCm: 84,
  jacketLengthCm: 72,
  sleeveCm: 61,
  shoulderCm: 45,
  heightCm: 175,
};

const CUSTOM_FIELDS: { key: keyof CustomSizeFields; min: number; max: number }[] = [
  { key: "chestCm", min: 80, max: 130 },
  { key: "waistCm", min: 68, max: 120 },
  { key: "jacketLengthCm", min: 60, max: 90 },
  { key: "sleeveCm", min: 54, max: 70 },
  { key: "shoulderCm", min: 38, max: 55 },
  { key: "heightCm", min: 155, max: 200 },
];

function CustomSizeAtelier({
  values,
  onChange,
  locale,
  onHighlight,
}: {
  values: CustomSizeFields;
  onChange: (values: CustomSizeFields) => void;
  locale: string;
  onHighlight: (key: MannequinHighlight) => void;
}) {
  const t = useTranslations("Shop.sizes");

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-gold">{t("customAtelier")}</p>
      {CUSTOM_FIELDS.map((field) => (
        <div key={field.key}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ivory-muted">{t(field.key)}</span>
            <span className="text-gold tabular-nums" dir="ltr">
              {values[field.key]} cm
            </span>
          </div>
          <input
            type="range"
            min={field.min}
            max={field.max}
            value={values[field.key]}
            onFocus={() => onHighlight(field.key)}
            onBlur={() => onHighlight(null)}
            onChange={(event) => onChange({ ...values, [field.key]: Number(event.target.value) })}
            className="w-full accent-gold"
            dir={locale === "ar" ? "rtl" : "ltr"}
          />
        </div>
      ))}
    </div>
  );
}

function MeasurementPanel({ size, locale }: { size: StandardSize; locale: string }) {
  const t = useTranslations("Shop.sizes");

  const rows: { label: string; value: string }[] = [
    { label: t("chestCm"), value: formatMeasurementRange(size.chestCm, locale) },
    { label: t("waistCm"), value: formatMeasurementRange(size.waistCm, locale) },
    { label: t("jacketLengthCm"), value: formatMeasurementRange(size.jacketLengthCm, locale) },
    { label: t("sleeveCm"), value: formatMeasurementRange(size.sleeveCm, locale) },
    { label: t("shoulderCm"), value: formatMeasurementRange(size.shoulderCm, locale) },
    { label: t("heightCm"), value: formatMeasurementRange(size.heightCm, locale) },
  ];

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gold mb-3">{t("measurements")}</p>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-ivory-faint">{row.label}</dt>
            <dd className="text-ivory mt-0.5" dir="ltr">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SizeStudio({
  measurements,
  mannequinLabel,
  subdued,
  highlight,
  children,
}: {
  measurements: MannequinMeasurements;
  mannequinLabel: string | null;
  subdued: boolean;
  highlight: MannequinHighlight;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-4 rounded-sm border border-gold-glow/20 bg-void/60 p-4 md:p-5"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,7.5rem)_1fr] md:items-start">
        <div className="flex justify-center md:justify-start">
          <SizeMannequin
            measurements={measurements}
            highlight={highlight}
            label={mannequinLabel}
            subdued={subdued}
          />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </motion.div>
  );
}

export default function ProductDetailClient({ product }: { product: ProductDetailData }) {
  const t = useTranslations("Shop");
  const tSizes = useTranslations("Shop.sizes");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { addItem } = useCart();
  const { cartAdded } = useAppToast();
  const sizeGridRef = useRef<HTMLDivElement>(null);

  const sizes = useMemo(() => {
    return (
      parseProductSizeChart(product.sizeChartJson)?.standardSizes ??
      defaultProductSizeChart().standardSizes
    );
  }, [product.sizeChartJson]);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customValues, setCustomValues] = useState<CustomSizeFields>(DEFAULT_CUSTOM);
  const [sizeError, setSizeError] = useState(false);
  const [mannequinHighlight, setMannequinHighlight] = useState<MannequinHighlight>(null);

  const name = isArabic ? product.nameAr : product.nameEn;
  const description = isArabic ? product.descAr : product.descEn;
  const unitPrice =
    product.salePrice != null && product.salePrice < product.price ? product.salePrice : product.price;
  const selectedSize = sizes.find((size) => size.code === selectedCode) ?? null;

  const mannequinMeasurements = useMemo(() => {
    if (customMode) return measurementsFromCustom(customValues);
    if (selectedSize) return measurementsFromStandardSize(selectedSize);
    return defaultMannequinMeasurements();
  }, [customMode, customValues, selectedSize]);

  const mannequinLabel = useMemo(() => {
    if (customMode) return tSizes("customSize");
    if (selectedSize) return isArabic ? selectedSize.labelAr : selectedSize.labelEn;
    return null;
  }, [customMode, isArabic, selectedSize, tSizes]);

  useEffect(() => {
    if (!sizeGridRef.current) return;
    const buttons = sizeGridRef.current.querySelectorAll("[data-size-btn]");
    gsap.fromTo(
      buttons,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
    );
  }, [sizes]);

  function selectStandard(code: string) {
    setCustomMode(false);
    setSelectedCode(code);
    setSizeError(false);
    setMannequinHighlight(null);

    const btn = sizeGridRef.current?.querySelector(`[data-size-btn="${code}"]`);
    if (btn) {
      gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
    }
  }

  function toggleCustom() {
    if (!product.customSizeEnabled) return;
    setCustomMode(true);
    setSelectedCode("custom");
    setSizeError(false);
    setMannequinHighlight(null);
  }

  function handleAddToCart() {
    if (!selectedCode) {
      setSizeError(true);
      return;
    }

    if (customMode) {
      addItem({
        productId: product.id,
        slug: product.slug,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        price: unitPrice,
        imageSrc: product.imageSrc,
        cartLineId: buildCartLineId(product.id, "custom"),
        sizeCode: "custom",
        sizeLabelEn: tSizes("customSize"),
        sizeLabelAr: tSizes("customSize"),
        isCustomSize: true,
        customMeasurements: { ...customValues },
      });
    } else if (selectedSize) {
      addItem({
        productId: product.id,
        slug: product.slug,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        price: unitPrice,
        imageSrc: product.imageSrc,
        cartLineId: buildCartLineId(product.id, selectedSize.code),
        sizeCode: selectedSize.code,
        sizeLabelEn: selectedSize.labelEn,
        sizeLabelAr: selectedSize.labelAr,
        isCustomSize: false,
      });
    }

    cartAdded(name);
  }

  return (
    <main className="site-page-shell mx-auto w-full max-w-[96rem]" dir={isArabic ? "rtl" : "ltr"}>
      <nav
        className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ivory-faint"
        aria-label={isArabic ? "مسار التنقل" : "Breadcrumb"}
      >
        <Link href="/" className="transition-colors hover:text-gold">
          {isArabic ? "الرئيسية" : "Home"}
        </Link>
        <span aria-hidden className="text-gold/40">
          /
        </span>
        <Link href="/shop" className="transition-colors hover:text-gold">
          {isArabic ? "المتجر" : "Shop"}
        </Link>
        <span aria-hidden className="text-gold/40">
          /
        </span>
        <span className="text-ivory-muted line-clamp-1">{name}</span>
      </nav>

      <Link
        href="/shop"
        className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ivory-muted transition-colors hover:text-gold"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={isArabic ? "rotate-180" : ""}>
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("backToShop")}
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-gold-glow/15">
          <Image src={product.imageSrc} alt={name} fill className="object-cover" priority />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">
            {product.collection ? localizeCollectionName(product.collection, locale) : t("detailLabel")}
          </p>
          <h1 className="font-serif text-3xl text-ivory sm:text-4xl">{name}</h1>
          <div className="mt-4">
            <PriceDisplay price={product.price} salePrice={product.salePrice} locale={locale} size="lg" />
          </div>
          {product.saleBadgeEn || product.saleBadgeAr ? (
            <p className="mt-2 inline-flex rounded-[2px] border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-gold">
              {isArabic ? product.saleBadgeAr ?? product.saleBadgeEn : product.saleBadgeEn ?? product.saleBadgeAr}
            </p>
          ) : null}
          <p className="mt-6 text-ivory-muted leading-relaxed">{description}</p>

          <section className="mt-10">
            <div className="flex items-center justify-between gap-4 mb-1">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-ivory">{tSizes("sizeGuide")}</h2>
              {product.customSizeEnabled ? (
                <button
                  type="button"
                  onClick={toggleCustom}
                  className={`text-[10px] uppercase tracking-wider transition-colors ${
                    customMode ? "text-gold" : "text-ivory-muted hover:text-gold"
                  }`}
                >
                  {tSizes("customSize")}
                </button>
              ) : null}
            </div>

            <p className="mb-4 text-xs leading-relaxed text-ivory-faint">{t("sizeRequiredNote")}</p>

            <div ref={sizeGridRef} className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const active = !customMode && selectedCode === size.code;
                return (
                  <button
                    key={size.code}
                    type="button"
                    data-size-btn={size.code}
                    onClick={() => selectStandard(size.code)}
                    className={`min-w-[3.25rem] px-4 py-3 rounded-sm text-sm font-medium border transition-all duration-300 ${
                      active
                        ? "border-gold bg-gold/15 text-gold shadow-[0_0_20px_rgba(201,168,76,0.15)]"
                        : "border-gold-glow/20 text-ivory-muted hover:border-gold/40 hover:text-ivory"
                    }`}
                  >
                    {size.code}
                  </button>
                );
              })}
            </div>

            {sizeError ? <p className="mt-2 text-xs text-red-300">{tSizes("selectSize")}</p> : null}

            <AnimatePresence mode="wait">
              {customMode && product.customSizeEnabled ? (
                <SizeStudio
                  key="custom"
                  measurements={mannequinMeasurements}
                  mannequinLabel={mannequinLabel}
                  subdued={false}
                  highlight={mannequinHighlight}
                >
                  <CustomSizeAtelier
                    values={customValues}
                    onChange={setCustomValues}
                    locale={locale}
                    onHighlight={setMannequinHighlight}
                  />
                </SizeStudio>
              ) : selectedSize ? (
                <SizeStudio
                  key={selectedSize.code}
                  measurements={mannequinMeasurements}
                  mannequinLabel={mannequinLabel}
                  subdued={false}
                  highlight={null}
                >
                  <MeasurementPanel size={selectedSize} locale={locale} />
                </SizeStudio>
              ) : (
                <SizeStudio
                  key="idle"
                  measurements={mannequinMeasurements}
                  mannequinLabel={null}
                  subdued
                  highlight={null}
                >
                  <p className="text-sm text-ivory-muted leading-relaxed">{tSizes("mannequinHint")}</p>
                </SizeStudio>
              )}
            </AnimatePresence>
          </section>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedCode}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold bg-gold text-void hover:bg-gold-muted transition-colors uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("addToCart")}
            </button>
            <Link
              href={`/fitting-room?product=${product.slug}`}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold border border-gold-muted text-gold hover:bg-gold/10 transition-all duration-300 uppercase tracking-[0.2em]"
            >
              {t("tryInFittingRoom")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
