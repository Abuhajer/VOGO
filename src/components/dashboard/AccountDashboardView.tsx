"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Role } from "@/types/db";
import type { AccountDashboardData } from "@/types/dashboard";
import StatCard from "@/components/dashboard/StatCard";
import DonutChart from "@/components/dashboard/DonutChart";
import CustomerOrdersList from "@/components/dashboard/CustomerOrdersList";
import AccountProfileForm from "@/components/dashboard/AccountProfileForm";
import { formatNumber } from "@/lib/format";

type AccountDashboardViewProps = {
  data: AccountDashboardData;
  statusLabels: Record<string, string>;
};

type Tab = "profile" | "orders";

function formatMemberDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function AccountDashboardView({ data: initialData, statusLabels }: AccountDashboardViewProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";

  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<Tab>("profile");

  const displayName = data.user.name ?? data.user.email ?? t("guest");
  const isAdmin = data.user.role === Role.ADMIN;
  const hasOrders = data.allOrders.length > 0;
  const initial = displayName.charAt(0).toUpperCase();

  const navItems: { id: Tab; label: string }[] = [
    { id: "profile", label: t("nav.profile") },
    { id: "orders", label: t("nav.orders") },
  ];

  return (
    <div className="account-dashboard mx-auto max-w-6xl" dir={isArabic ? "rtl" : "ltr"}>
      <header className="mb-8 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{t("eyebrow")}</p>
        <h1 className="font-serif text-3xl text-ivory md:text-4xl">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-ivory-muted">{t("pageDesc")}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-sm border border-gold-glow/15 bg-surface/40 p-5">
            <div className="flex items-center gap-3">
              {data.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.user.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full border border-gold/30 object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-serif text-lg text-gold">
                  {initial}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ivory">{displayName}</p>
                <p className="truncate text-xs text-ivory-faint">{data.user.email}</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-ivory-faint">
              {t("memberSince", { date: formatMemberDate(data.user.memberSince, locale) })}
              <span className="mx-1.5 text-gold/30" aria-hidden>
                ·
              </span>
              {isAdmin ? t("roleAdmin") : t("roleCustomer")}
            </p>
          </div>

          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label={t("nav.label")}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-sm px-4 py-3 text-start text-sm transition-colors lg:w-full ${
                  tab === item.id
                    ? "border border-gold/30 bg-gold/10 text-gold"
                    : "border border-transparent text-ivory-muted hover:border-gold-glow/15 hover:bg-surface/40 hover:text-ivory"
                }`}
                aria-current={tab === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {isAdmin ? (
            <Link
              href="/admin"
              className="group flex items-center justify-between gap-3 rounded-sm border border-gold/25 bg-gold/[0.06] px-4 py-3 transition-colors hover:border-gold/40 hover:bg-gold/10"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gold">{t("adminWorkspace")}</p>
                <p className="mt-0.5 text-xs text-ivory-muted">{t("adminWorkspaceDesc")}</p>
              </div>
              <span
                className="text-gold transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </Link>
          ) : null}
        </aside>

        <div className="min-w-0">
          {tab === "profile" ? (
            <AccountProfileForm
              user={data.user}
              onProfileSaved={(user) => setData((prev) => ({ ...prev, user }))}
            />
          ) : (
            <div className="space-y-6">
              {hasOrders ? (
                <>
                  <section className="grid gap-4 sm:grid-cols-3">
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

                  <section className="grid gap-4 lg:grid-cols-5">
                    {data.statusBreakdown.length > 0 ? (
                      <div className="rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6 lg:col-span-2">
                        <h2 className="font-serif text-xl text-ivory">{t("orderInsights")}</h2>
                        <p className="mt-1 text-xs text-ivory-faint">{t("orderInsightsHint")}</p>
                        <div className="mt-6">
                          <DonutChart segments={data.statusBreakdown} locale={locale} emptyLabel={t("noOrders")} />
                        </div>
                      </div>
                    ) : null}

                    <div
                      className={`rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6 ${
                        data.statusBreakdown.length > 0 ? "lg:col-span-3" : "lg:col-span-5"
                      }`}
                    >
                      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="font-serif text-xl text-ivory">{t("orders")}</h2>
                          <p className="mt-1 text-xs text-ivory-faint">{t("ordersHint")}</p>
                        </div>
                        {data.allOrders.length > 5 ? (
                          <p className="text-xs text-ivory-faint">
                            {t("ordersCount", { count: formatNumber(data.allOrders.length, locale) })}
                          </p>
                        ) : null}
                      </div>
                      <CustomerOrdersList
                        orders={data.allOrders}
                        statusLabels={statusLabels}
                      />
                    </div>
                  </section>
                </>
              ) : (
                <section className="account-empty rounded-sm border border-dashed border-gold-glow/20 bg-obsidian/40 px-6 py-14 text-center md:py-16">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold-glow/20 bg-surface/60">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-gold/60">
                      <path
                        d="M4 7h16M4 7l1.5 12h13L20 7M4 7l2-3h12l2 3"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="font-serif text-2xl text-ivory">{t("noOrdersTitle")}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ivory-muted">{t("noOrders")}</p>
                  <Link
                    href="/shop"
                    className="mt-8 inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#0E0D12] transition-shadow hover:shadow-[0_0_24px_rgba(201,168,76,0.28)]"
                  >
                    {t("shopCta")}
                  </Link>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
