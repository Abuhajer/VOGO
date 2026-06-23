"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { CustomerOrderDetail } from "@/types/dashboard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import OrderStatusStepper from "@/components/admin/OrderStatusStepper";
import { formatNumber } from "@/lib/format";
import PhoneText from "@/components/form/PhoneText";

type CustomerOrderDetailViewProps = {
  order: CustomerOrderDetail;
  statusLabels: Record<string, string>;
};

function formatOrderDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function itemSizeLabel(
  item: CustomerOrderDetail["items"][number],
  isArabic: boolean
): string | null {
  const label = isArabic ? item.sizeLabelAr : item.sizeLabelEn;
  if (label) return label;
  if (item.sizeCode) return item.sizeCode;
  return null;
}

function itemMeasurements(item: CustomerOrderDetail["items"][number]): string | null {
  if (!item.customMeasurementsJson) return null;
  try {
    const parsed = JSON.parse(item.customMeasurementsJson) as Record<string, string | number>;
    const parts = Object.entries(parsed)
      .filter(([, value]) => value !== "" && value != null)
      .map(([key, value]) => `${key}: ${value}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  } catch {
    return null;
  }
}

function paymentLabel(method: string, isArabic: boolean) {
  if (method === "STRIPE") return isArabic ? "بطاقة (Stripe)" : "Card (Stripe)";
  if (method === "COD") return isArabic ? "الدفع عند الاستلام" : "Cash on delivery";
  return method;
}

export default function CustomerOrderDetailView({ order, statusLabels }: CustomerOrderDetailViewProps) {
  const t = useTranslations("Account.orderDetail");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-ivory-faint transition-colors hover:text-gold"
          >
            <span aria-hidden className="rtl:rotate-180">
              ←
            </span>
            {t("backToAccount")}
          </Link>
          <h1 className="mt-3 font-serif text-2xl text-ivory md:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ivory-muted">{formatOrderDate(order.createdAt, locale)}</p>
        </div>
        <OrderStatusBadge status={order.status} label={statusLabels[order.status] ?? order.status} />
      </div>

      <section className="rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-gold">{t("trackingTitle")}</h2>
        <div className="mt-6">
          <OrderStatusStepper status={order.status} statusLabels={statusLabels} />
        </div>
      </section>

      <section className="rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
        <h2 className="mb-4 font-serif text-xl text-ivory">{t("itemsTitle")}</h2>
        <div className="space-y-3">
          {order.items.map((item) => {
            const size = itemSizeLabel(item, isArabic);
            const measurements = itemMeasurements(item);
            return (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-2 border-b border-gold-glow/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-ivory">{isArabic ? item.nameAr : item.nameEn}</p>
                <p className="mt-0.5 text-xs text-ivory-faint">
                  {t("quantity")}: {formatNumber(item.quantity, locale)}
                  {size ? ` · ${t("size")}: ${size}` : ""}
                </p>
                {measurements ? (
                  <p className="mt-0.5 text-xs text-ivory-faint">
                    {t("measurements")}: {measurements}
                  </p>
                ) : null}
              </div>
              <p className="font-medium text-gold">
                {formatNumber(item.unitPrice * item.quantity, locale)} {currency}
              </p>
            </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-2 border-t border-gold-glow/15 pt-4 text-sm">
          <div className="flex justify-between text-ivory-muted">
            <span>{t("subtotal")}</span>
            <span>
              {formatNumber(order.subtotal, locale)} {currency}
            </span>
          </div>
          {order.discountAmount > 0 ? (
            <div className="flex justify-between text-success">
              <span>
                {t("discount")}
                {order.promoCode ? ` (${order.promoCode})` : ""}
              </span>
              <span>
                −{formatNumber(order.discountAmount, locale)} {currency}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between font-medium text-ivory pt-1">
            <span>{t("total")}</span>
            <span className="text-gold">
              {formatNumber(order.total, locale)} {currency}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-sm border border-gold-glow/15 bg-surface/30 p-5">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-gold">{t("contactTitle")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-ivory-faint">{t("name")}</dt>
              <dd className="text-ivory">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-ivory-faint">{t("email")}</dt>
              <dd className="text-ivory" dir="ltr">
                {order.customerEmail}
              </dd>
            </div>
            <div>
              <dt className="text-ivory-faint">{t("phone")}</dt>
              <dd className="text-ivory">
                <PhoneText value={order.customerPhone} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-sm border border-gold-glow/15 bg-surface/30 p-5">
          <h2 className="text-[10px] uppercase tracking-[0.18em] text-gold">{t("paymentTitle")}</h2>
          <p className="mt-4 text-sm text-ivory">{paymentLabel(order.paymentMethod, isArabic)}</p>
          {order.notes ? (
            <div className="mt-4 border-t border-gold-glow/10 pt-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ivory-faint">{t("notes")}</p>
              <p className="mt-1 text-sm text-ivory-muted leading-relaxed">{order.notes}</p>
            </div>
          ) : null}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="inline-flex min-h-10 items-center justify-center rounded-sm border border-gold/30 px-6 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
        >
          {t("shopAgain")}
        </Link>
      </div>
    </div>
  );
}
