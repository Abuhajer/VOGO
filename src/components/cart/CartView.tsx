"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartProvider";
import { useAppToast } from "@/hooks/useAppToast";
import { formatNumber } from "@/lib/format";
import { getProductName, resolveCartLineId, type CartItem } from "@/lib/cart";

const MAX_QTY = 10;

function CartEmptyState({ isAr }: { isAr: boolean }) {
  const t = useTranslations("Cart");

  return (
    <div
      className="cart-empty mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="cart-empty-icon mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold-glow/20 bg-surface/60">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden className="text-gold/70">
          <path
            d="M6 6h15l-1.5 9h-12L6 6ZM6 6L5 3H2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="19" r="1.25" fill="currentColor" />
          <circle cx="16.5" cy="19" r="1.25" fill="currentColor" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl text-ivory sm:text-3xl">{t("emptyTitle")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ivory-muted">{t("emptyDesc")}</p>
      <Link
        href="/shop"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-sm bg-gold px-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#0E0D12] transition-shadow hover:shadow-[0_0_24px_rgba(201,168,76,0.28)]"
      >
        {t("continueShopping")}
      </Link>
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
  isAr,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  isAr: boolean;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div
      className="cart-qty inline-flex items-center rounded-sm border border-gold-glow/20 bg-void/80"
      dir="ltr"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={decreaseLabel}
        className="flex h-9 w-9 items-center justify-center text-ivory-muted transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
      >
        <span className="text-lg leading-none">−</span>
      </button>
      <span className="min-w-[2.25rem] text-center text-sm font-medium tabular-nums text-ivory">
        {formatNumber(value, isAr ? "ar" : "en")}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(MAX_QTY, value + 1))}
        disabled={value >= MAX_QTY}
        aria-label={increaseLabel}
        className="flex h-9 w-9 items-center justify-center text-ivory-muted transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  );
}

function CartLineItem({
  item,
  locale,
  isAr,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  locale: string;
  isAr: boolean;
  onUpdateQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
}) {
  const t = useTranslations("Cart");
  const lineId = resolveCartLineId(item);
  const name = getProductName(item, locale);
  const sizeLabel = isAr ? item.sizeLabelAr ?? item.sizeLabelEn : item.sizeLabelEn ?? item.sizeLabelAr;
  const lineTotal = item.price * item.quantity;
  const currency = isAr ? "د.أ" : "JOD";

  return (
    <article className="cart-line group relative border-b border-gold-glow/10 py-5 first:pt-0 last:border-b-0">
      <div className="cart-line-grid grid gap-4 sm:gap-5">
        {/* Product */}
        <div className="flex min-w-0 gap-4 sm:col-span-2">
          <Link
            href={`/shop/${item.slug}`}
            className="relative h-[7.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-sm border border-gold-glow/12 bg-obsidian sm:h-32 sm:w-24"
          >
            <Image src={item.imageSrc} alt={name} fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/shop/${item.slug}`}
              className="font-serif text-base leading-snug text-ivory transition-colors hover:text-gold sm:text-lg"
            >
              {name}
            </Link>
            {sizeLabel || item.isCustomSize ? (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ivory-muted">
                <span className="rounded-[2px] border border-gold-glow/15 bg-surface/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gold/90">
                  {item.isCustomSize ? t("customSize") : t("sizeLabel")}
                </span>
                <span>{item.isCustomSize ? t("customSizeNote") : sizeLabel}</span>
              </p>
            ) : null}
            {item.isCustomSize && item.customMeasurements ? (
              <p className="mt-1 text-[10px] leading-relaxed text-ivory-faint">
                {t("measurements")}: {item.customMeasurements.chestCm} / {item.customMeasurements.waistCm} /{" "}
                {item.customMeasurements.jacketLengthCm} cm
              </p>
            ) : null}
            <p className="mt-2 text-sm text-gold sm:hidden">
              {formatNumber(item.price, locale)} {currency}
            </p>
            <button
              type="button"
              onClick={() => onRemove(lineId)}
              className="mt-3 text-[10px] uppercase tracking-[0.14em] text-ivory-faint transition-colors hover:text-gold sm:mt-2"
            >
              {t("remove")}
            </button>
          </div>
        </div>

        {/* Unit price — desktop */}
        <div className="hidden items-center text-sm text-ivory-muted sm:flex">
          {formatNumber(item.price, locale)} {currency}
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between gap-3 sm:justify-center">
          <span className="text-[10px] uppercase tracking-[0.14em] text-ivory-faint sm:sr-only">{t("quantityColumn")}</span>
          <QuantityStepper
            value={item.quantity}
            onChange={(next) => onUpdateQty(lineId, next)}
            isAr={isAr}
            decreaseLabel={t("decreaseQty")}
            increaseLabel={t("increaseQty")}
          />
        </div>

        {/* Line total */}
        <div className="flex items-center justify-between sm:justify-end">
          <span className="text-[10px] uppercase tracking-[0.14em] text-ivory-faint sm:sr-only">{t("totalColumn")}</span>
          <span className="font-serif text-base text-ivory sm:text-lg">
            {formatNumber(lineTotal, locale)} {currency}
          </span>
        </div>
      </div>
    </article>
  );
}

function CartOrderSummary({
  itemCount,
  subtotal,
  locale,
  isAr,
}: {
  itemCount: number;
  subtotal: number;
  locale: string;
  isAr: boolean;
}) {
  const t = useTranslations("Cart");
  const currency = isAr ? "د.أ" : "JOD";

  return (
    <aside className="cart-summary" dir={isAr ? "rtl" : "ltr"}>
      <div className="cart-summary-card rounded-sm border border-gold-glow/18 bg-surface/70 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-sm light:shadow-[0_12px_36px_rgba(14,13,18,0.08)] sm:p-6">
        <h2 className="font-serif text-xl text-ivory">{t("orderSummary")}</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ivory-muted">{t("itemsLabel")}</dt>
            <dd className="tabular-nums text-ivory">{t("itemCount", { count: itemCount })}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-gold-glow/10 pt-3">
            <dt className="font-medium text-ivory">{t("subtotal")}</dt>
            <dd className="font-serif text-xl tabular-nums text-gold">
              {formatNumber(subtotal, locale)} {currency}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-ivory-faint">{t("shippingNote")}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ivory-faint">{t("tailoringNote")}</p>

        <Link
          href="/checkout"
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-sm bg-gold text-xs font-semibold uppercase tracking-[0.18em] text-[#0E0D12] transition-all hover:shadow-[0_0_28px_rgba(201,168,76,0.32)]"
        >
          {t("checkout")}
        </Link>

        <Link
          href="/shop"
          className="mt-3 flex min-h-10 w-full items-center justify-center text-[10px] uppercase tracking-[0.16em] text-ivory-muted transition-colors hover:text-gold"
        >
          {t("continueShopping")}
        </Link>

        <ul className="cart-trust mt-6 space-y-2.5 border-t border-gold-glow/10 pt-5">
          {(["secureCheckout", "codAvailable", "tailoringCraft"] as const).map((key) => (
            <li key={key} className="flex items-start gap-2.5 text-[11px] text-ivory-muted">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2.5 6.5L5 9l4.5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function CartView() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { cartRemoved, quantityUpdated } = useAppToast();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQty = (lineId: string, next: number) => {
    updateQuantity(lineId, next);
    quantityUpdated();
  };

  const handleRemove = (lineId: string) => {
    removeItem(lineId);
    cartRemoved();
  };

  if (items.length === 0) {
    return <CartEmptyState isAr={isAr} />;
  }

  return (
    <div className="cart-page" dir={isAr ? "rtl" : "ltr"}>
      <div className="cart-layout grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-12">
        <section className="cart-items min-w-0">
          <div className="cart-items-header mb-1 hidden border-b border-gold-glow/15 pb-3 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(5rem,1fr)_minmax(7rem,1fr)_minmax(5rem,1fr)] sm:gap-5 sm:text-[10px] sm:uppercase sm:tracking-[0.16em] sm:text-ivory-faint">
            <span>{t("productColumn")}</span>
            <span className="text-center">{t("priceColumn")}</span>
            <span className="text-center">{t("quantityColumn")}</span>
            <span className="text-end">{t("totalColumn")}</span>
          </div>

          <div className="cart-items-list rounded-sm border border-gold-glow/12 bg-obsidian/40 px-4 sm:px-5">
            {items.map((item) => (
              <CartLineItem
                key={resolveCartLineId(item)}
                item={item}
                locale={locale}
                isAr={isAr}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </section>

        <CartOrderSummary itemCount={itemCount} subtotal={subtotal} locale={locale} isAr={isAr} />
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="cart-mobile-bar fixed inset-x-0 bottom-0 z-30 border-t border-gold-glow/15 bg-void/95 px-4 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-ivory-faint">{t("subtotal")}</p>
            <p className="font-serif text-lg text-gold">
              {formatNumber(subtotal, locale)} {isAr ? "د.أ" : "JOD"}
            </p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm bg-gold px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0E0D12]"
          >
            {t("checkout")}
          </Link>
        </div>
      </div>

      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}
