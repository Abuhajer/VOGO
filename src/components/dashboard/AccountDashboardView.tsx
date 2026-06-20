"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Role } from "@/types/db";
import type { AccountDashboardData } from "@/types/dashboard";
import StatCard from "@/components/dashboard/StatCard";
import DonutChart from "@/components/dashboard/DonutChart";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import { formatNumber } from "@/lib/format";

type AccountDashboardViewProps = {
  data: AccountDashboardData;
  statusLabels: Record<string, string>;
};

function formatMemberDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatOrderDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AccountDashboardView({ data, statusLabels }: AccountDashboardViewProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";
  const displayName = data.user.name ?? data.user.email ?? t("guest");
  const isAdmin = data.user.role === Role.ADMIN;
  const hasOrders = data.recentOrders.length > 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-sm border border-gold-glow/15 bg-obsidian">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.12),transparent_55%)]" />
        <div className="relative p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-serif text-xl text-gold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{t("eyebrow")}</p>
              <h1 className="mt-2 font-serif text-3xl md:text-4xl text-ivory truncate">
                {t("welcome", { name: displayName })}
              </h1>
              <p className="mt-2 text-sm text-ivory-muted truncate">{data.user.email}</p>
              <p className="mt-2 text-xs text-ivory-faint">
                {t("memberSince", { date: formatMemberDate(data.user.memberSince, locale) })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 bg-gold text-[#0E0D12] hover:shadow-[0_0_25px_rgba(201,168,76,0.3)]"
              >
                {t("storeDashboard")}
              </Link>
            ) : null}
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 border border-gold-muted text-gold hover:bg-gold/10"
            >
              {t("shopCta")}
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-sm font-sans text-xs font-semibold text-ivory-faint hover:text-gold transition-colors"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </section>

      {hasOrders ? (
        <>
          <section className="grid sm:grid-cols-3 gap-4">
            <StatCard label={t("totalOrders")} value={formatNumber(data.stats.orderCount, locale)} />
            <StatCard
              label={t("totalSpent")}
              value={`${formatNumber(data.stats.totalSpent, locale)} ${currency}`}
              accent="emerald"
            />
            <StatCard
              label={t("pendingOrders")}
              value={formatNumber(data.stats.pendingCount, locale)}
              accent="ivory"
            />
          </section>

          <section className="grid lg:grid-cols-5 gap-4">
            {data.statusBreakdown.length > 0 ? (
              <div className="lg:col-span-2 rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
                <h2 className="font-serif text-xl text-ivory">{t("orderInsights")}</h2>
                <div className="mt-6">
                  <DonutChart
                    segments={data.statusBreakdown}
                    locale={locale}
                    emptyLabel={t("noOrders")}
                  />
                </div>
              </div>
            ) : null}

            <div
              className={`rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6 ${
                data.statusBreakdown.length > 0 ? "lg:col-span-3" : "lg:col-span-5"
              }`}
            >
              <h2 className="font-serif text-xl text-ivory mb-6">{t("orders")}</h2>
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
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-sm border border-gold-glow/15 bg-obsidian px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ivory mb-2">{t("noOrdersTitle")}</p>
          <p className="text-sm text-ivory-muted mb-8 max-w-md mx-auto">{t("noOrders")}</p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 bg-gold text-[#0E0D12]"
          >
            {t("shopCta")}
          </Link>
        </section>
      )}
    </div>
  );
}
