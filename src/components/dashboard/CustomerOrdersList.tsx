"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { DashboardOrderRow } from "@/types/dashboard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import { formatNumber } from "@/lib/format";

type CustomerOrdersListProps = {
  orders: DashboardOrderRow[];
  statusLabels: Record<string, string>;
  limit?: number;
  showViewAll?: boolean;
};

function formatOrderDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CustomerOrdersList({
  orders,
  statusLabels,
  limit,
  showViewAll = false,
}: CustomerOrdersListProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";

  const visible = limit ? orders.slice(0, limit) : orders;
  const hasMore = limit ? orders.length > limit : false;

  return (
    <div className="space-y-3">
      {visible.map((order) => (
        <Link
          key={order.id}
          href={`/dashboard/orders/${order.id}`}
          className="group flex flex-col justify-between gap-4 rounded-sm border border-gold-glow/10 bg-void/40 px-4 py-4 transition-colors hover:border-gold/25 hover:bg-void/60 sm:flex-row sm:items-center"
        >
          <div className="min-w-0">
            <p className="font-serif text-lg text-ivory group-hover:text-gold transition-colors">
              {order.orderNumber}
            </p>
            <p className="mt-1 text-xs text-ivory-faint">
              {formatOrderDate(order.createdAt, locale)} · {formatNumber(order.itemCount, locale)}{" "}
              {t("items")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <OrderStatusBadge status={order.status} label={statusLabels[order.status] ?? order.status} />
            <p className="font-medium text-gold">
              {formatNumber(order.total, locale)} {currency}
            </p>
            <span
              className="text-gold/60 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </div>
        </Link>
      ))}

      {showViewAll && hasMore ? (
        <p className="pt-2 text-center text-xs text-ivory-faint">
          {t("ordersShowing", { shown: formatNumber(limit!, locale), total: formatNumber(orders.length, locale) })}
        </p>
      ) : null}
    </div>
  );
}
