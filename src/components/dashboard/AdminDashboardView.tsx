"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AdminDashboardData } from "@/types/dashboard";
import StatCard from "@/components/dashboard/StatCard";
import BarChart from "@/components/dashboard/BarChart";
import DonutChart from "@/components/dashboard/DonutChart";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import { formatNumber } from "@/lib/format";

type AdminDashboardViewProps = {
  data: AdminDashboardData;
  statusLabels: Record<string, string>;
};

function formatOrderDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminDashboardView({ data, statusLabels }: AdminDashboardViewProps) {
  const t = useTranslations("Admin.Dashboard");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label={t("revenue")}
          value={`${formatNumber(data.stats.revenue, locale)} ${currency}`}
          hint={t("revenueHint")}
        />
        <StatCard
          label={t("weekRevenue")}
          value={`${formatNumber(data.stats.weekRevenue, locale)} ${currency}`}
          hint={t("weekRevenueHint")}
          accent="emerald"
        />
        <StatCard
          label={t("orders")}
          value={formatNumber(data.stats.orders, locale)}
          hint={t("ordersHint", { pending: formatNumber(data.stats.pendingOrders, locale) })}
        />
        <StatCard label={t("customers")} value={formatNumber(data.stats.customers, locale)} />
        <StatCard label={t("products")} value={formatNumber(data.stats.products, locale)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
          <h2 className="font-serif text-xl text-ivory">{t("revenueTrend")}</h2>
          <p className="mt-1 text-sm text-ivory-muted mb-5">{t("revenueTrendHint")}</p>
          <BarChart
            data={data.revenueTrend}
            locale={locale}
            unit={currency}
            emptyLabel={t("chartEmpty")}
          />
        </section>

        <section className="rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
          <h2 className="font-serif text-xl text-ivory">{t("statusBreakdown")}</h2>
          <p className="mt-1 text-sm text-ivory-muted mb-5">{t("statusBreakdownHint")}</p>
          <DonutChart segments={data.statusBreakdown} locale={locale} emptyLabel={t("chartEmpty")} />
        </section>
      </div>

      <section className="rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-serif text-xl text-ivory">{t("recentOrders")}</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-gold hover:underline"
          >
            {t("viewAllOrders")}
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-ivory-muted">{t("chartEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-gold-glow/10 bg-void/40 px-4 py-4"
              >
                <div>
                  <p className="font-serif text-lg text-ivory">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-ivory-faint">
                    {formatOrderDate(order.createdAt, locale)} · {formatNumber(order.itemCount, locale)}{" "}
                    {t("items")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <OrderStatusBadge
                    status={order.status}
                    label={statusLabels[order.status] ?? order.status}
                  />
                  <p className="text-gold font-medium">
                    {formatNumber(order.total, locale)} {currency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
