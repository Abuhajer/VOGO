"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  addCustomerFeedback,
  addCustomerNote,
  getAdminCustomerDetail,
  type AdminCustomerDetail,
  type AdminCustomerSummary,
} from "@/server/customers";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import { useAppToast } from "@/hooks/useAppToast";
import { formatNumber } from "@/lib/format";
import PhoneText from "@/components/form/PhoneText";

type Filter = "all" | "buyers" | "inactive" | "vip";
type SortKey = "recent" | "spend" | "orders" | "name";
type DetailTab = "overview" | "orders" | "notes" | "feedback";

type Props = {
  customers: AdminCustomerSummary[];
  statusLabels: Record<string, string>;
};

function formatDate(value: string | null, locale: string, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function customerInitial(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.charAt(0).toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function AdminCustomersClient({ customers, statusLabels }: Props) {
  const t = useTranslations("Admin.Customers");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";
  const { adminSuccess, adminError } = useAppToast();

  function feedbackSourceLabel(source: string) {
    const labels: Record<string, string> = {
      admin: t("source_admin"),
      whatsapp: t("source_whatsapp"),
      in_store: t("source_in_store"),
      checkout: t("source_checkout"),
    };
    return labels[source] ?? source;
  }

  const [rows, setRows] = useState(customers);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(customers[0]?.id ?? null);
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(5);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    let revenue = 0;
    let buyers = 0;
    for (const customer of rows) {
      revenue += customer.totalSpent;
      if (customer.orderCount > 0) buyers += 1;
    }
    return {
      total: rows.length,
      buyers,
      revenue,
      avgSpend: buyers > 0 ? Math.round(revenue / buyers) : 0,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((customer) => {
      if (!q) return true;
      return (
        customer.email.toLowerCase().includes(q) ||
        (customer.name?.toLowerCase().includes(q) ?? false) ||
        (customer.phone?.toLowerCase().includes(q) ?? false)
      );
    });

    if (filter === "buyers") list = list.filter((c) => c.orderCount > 0);
    if (filter === "inactive") list = list.filter((c) => c.orderCount === 0);
    if (filter === "vip") list = list.filter((c) => c.totalSpent >= 500);

    list = [...list].sort((a, b) => {
      if (sort === "spend") return b.totalSpent - a.totalSpent;
      if (sort === "orders") return b.orderCount - a.orderCount;
      if (sort === "name") {
        const an = (a.name ?? a.email).toLowerCase();
        const bn = (b.name ?? b.email).toLowerCase();
        return an.localeCompare(bn, locale);
      }
      const aDate = a.lastOrderAt ?? a.createdAt;
      const bDate = b.lastOrderAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return list;
  }, [rows, query, filter, sort, locale]);

  const selectedSummary = rows.find((c) => c.id === selectedId) ?? null;

  const loadDetail = useCallback(
    async (customerId: string) => {
      setLoadingDetail(true);
      try {
        const data = await getAdminCustomerDetail(customerId, locale);
        setDetail(data);
      } catch {
        adminError(t("detailError"));
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [locale, adminError, t]
  );

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  async function handleAddNote() {
    if (!selectedId || !noteDraft.trim()) return;
    setBusy(true);
    try {
      const note = await addCustomerNote({ customerId: selectedId, content: noteDraft.trim() });
      setDetail((current) =>
        current ? { ...current, notes: [note, ...current.notes], noteCount: current.noteCount + 1 } : current
      );
      setRows((current) =>
        current.map((row) =>
          row.id === selectedId ? { ...row, noteCount: row.noteCount + 1 } : row
        )
      );
      setNoteDraft("");
      adminSuccess(t("noteAdded"));
    } catch {
      adminError(t("noteError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddFeedback() {
    if (!selectedId || !feedbackDraft.trim()) return;
    setBusy(true);
    try {
      const entry = await addCustomerFeedback({
        customerId: selectedId,
        comment: feedbackDraft.trim(),
        rating: feedbackRating,
        source: "admin",
      });
      setDetail((current) =>
        current
          ? { ...current, feedback: [entry, ...current.feedback], feedbackCount: current.feedbackCount + 1 }
          : current
      );
      setRows((current) =>
        current.map((row) =>
          row.id === selectedId ? { ...row, feedbackCount: row.feedbackCount + 1 } : row
        )
      );
      setFeedbackDraft("");
      setFeedbackRating(5);
      adminSuccess(t("feedbackAdded"));
    } catch {
      adminError(t("feedbackError"));
    } finally {
      setBusy(false);
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "buyers", label: t("filterBuyers") },
    { key: "inactive", label: t("filterInactive") },
    { key: "vip", label: t("filterVip") },
  ];

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: "overview", label: t("tabOverview") },
    { key: "orders", label: t("tabOrders"), count: detail?.orderCount },
    { key: "notes", label: t("tabNotes"), count: detail?.noteCount },
    { key: "feedback", label: t("tabFeedback"), count: detail?.feedbackCount },
  ];

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <p className="text-sm text-ivory-muted -mt-2">{t("subtitle")}</p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statTotal")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.total, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statBuyers")}</p>
          <p className="mt-2 font-serif text-2xl text-gold">{formatNumber(stats.buyers, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statRevenue")}</p>
          <p className="mt-2 font-serif text-2xl admin-stat-success">
            {formatNumber(stats.revenue, locale)} {currency}
          </p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statAvgSpend")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">
            {formatNumber(stats.avgSpend, locale)} {currency}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`px-3 py-2 rounded-sm text-[11px] uppercase tracking-wider border transition-colors ${
                filter === item.key
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-gold-glow/15 text-ivory-muted hover:text-ivory"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full sm:w-64 bg-void border border-gold-glow/20 rounded-sm px-3 py-2.5 text-sm text-ivory placeholder:text-ivory-faint"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="bg-void border border-gold-glow/20 rounded-sm px-3 py-2.5 text-xs text-ivory"
            aria-label={t("sortLabel")}
          >
            <option value="recent">{t("sortRecent")}</option>
            <option value="spend">{t("sortSpend")}</option>
            <option value="orders">{t("sortOrders")}</option>
            <option value="name">{t("sortName")}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ivory mb-2">{t("emptyTitle")}</p>
          <p className="text-sm text-ivory-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pe-1">
            {filtered.map((customer) => {
              const active = selectedId === customer.id;
              const displayName = customer.name ?? customer.email;

              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(customer.id);
                    setDetailTab("overview");
                  }}
                  className={`w-full text-start rounded-sm border p-4 transition-all ${
                    active
                      ? "border-gold/40 bg-gold/[0.07] shadow-[0_0_24px_rgba(201,168,76,0.08)]"
                      : "border-gold-glow/15 bg-obsidian hover:border-gold/25"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-serif text-lg text-gold">
                      {customerInitial(customer.name, customer.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-lg text-ivory truncate">{displayName}</p>
                        {customer.totalSpent >= 500 ? (
                          <span className="shrink-0 rounded-[2px] border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gold">
                            VIP
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-ivory-muted truncate" dir="ltr">
                        {customer.email}
                      </p>
                      {customer.phone ? (
                        <PhoneText value={customer.phone} className="text-xs text-ivory-faint mt-0.5" as="p" />
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ivory-faint">
                        <span>
                          {formatNumber(customer.orderCount, locale)} {t("orders")}
                        </span>
                        <span className="text-gold">
                          {formatNumber(customer.totalSpent, locale)} {currency}
                        </span>
                        {customer.lastOrderAt ? (
                          <span>{formatDate(customer.lastOrderAt, locale)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-sm border border-gold-glow/15 bg-obsidian min-h-[420px] xl:sticky xl:top-28 xl:self-start">
            {!selectedSummary ? (
              <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-center">
                <p className="text-sm text-ivory-muted">{t("selectCustomer")}</p>
              </div>
            ) : loadingDetail && !detail ? (
              <div className="flex h-full min-h-[420px] items-center justify-center p-8">
                <p className="text-sm text-ivory-muted">{t("loading")}</p>
              </div>
            ) : detail ? (
              <div className="flex flex-col h-full">
                <div className="border-b border-gold-glow/10 p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-serif text-xl text-gold">
                      {customerInitial(detail.name, detail.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-2xl text-ivory truncate">
                        {detail.name ?? detail.email}
                      </h2>
                      <p className="text-sm text-ivory-muted mt-0.5" dir="ltr">
                        {detail.email}
                      </p>
                      {detail.phone ? (
                        <PhoneText value={detail.phone} className="text-sm text-ivory-faint mt-1" as="p" />
                      ) : (
                        <p className="text-xs text-ivory-faint mt-1">{t("noPhone")}</p>
                      )}
                      <p className="text-xs text-ivory-faint mt-2">
                        {t("memberSince", { date: formatDate(detail.createdAt, locale) })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-sm border border-gold-glow/10 bg-void/40 px-3 py-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-ivory-faint">{t("orders")}</p>
                      <p className="mt-1 font-serif text-lg text-ivory">
                        {formatNumber(detail.orderCount, locale)}
                      </p>
                    </div>
                    <div className="rounded-sm border border-gold-glow/10 bg-void/40 px-3 py-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-ivory-faint">{t("lifetimeSpend")}</p>
                      <p className="mt-1 font-serif text-lg text-gold">
                        {formatNumber(detail.totalSpent, locale)} {currency}
                      </p>
                    </div>
                    <div className="rounded-sm border border-gold-glow/10 bg-void/40 px-3 py-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-ivory-faint">{t("avgOrder")}</p>
                      <p className="mt-1 font-serif text-lg text-ivory">
                        {formatNumber(detail.avgOrderValue, locale)} {currency}
                      </p>
                    </div>
                    <div className="rounded-sm border border-gold-glow/10 bg-void/40 px-3 py-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-ivory-faint">{t("lastOrder")}</p>
                      <p className="mt-1 text-sm text-ivory">
                        {formatDate(detail.lastOrderAt, locale)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 border-b border-gold-glow/10 px-5 md:px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setDetailTab(tab.key)}
                      className={`px-3 py-3 text-[11px] uppercase tracking-wider border-b-2 transition-colors ${
                        detailTab === tab.key
                          ? "border-gold text-gold"
                          : "border-transparent text-ivory-muted hover:text-ivory"
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined ? ` (${formatNumber(tab.count, locale)})` : ""}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5 md:p-6 max-h-none min-h-[12rem] sm:max-h-[min(70dvh,32rem)] xl:max-h-[calc(70vh-220px)]">
                  <AnimatePresence mode="wait">
                    {detailTab === "overview" ? (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-5"
                      >
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-ivory-faint mb-3">
                            {t("recentOrders")}
                          </p>
                          {detail.orders.length === 0 ? (
                            <p className="text-sm text-ivory-muted">{t("noOrdersYet")}</p>
                          ) : (
                            <ul className="space-y-2">
                              {detail.orders.slice(0, 3).map((order) => (
                                <li
                                  key={order.id}
                                  className="flex items-center justify-between gap-3 rounded-sm border border-gold-glow/10 bg-void/40 px-3 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm text-ivory">{order.orderNumber}</p>
                                    <p className="text-xs text-ivory-faint mt-0.5">
                                      {formatDate(order.createdAt, locale, true)}
                                    </p>
                                  </div>
                                  <div className="text-end shrink-0">
                                    <OrderStatusBadge
                                      status={order.status}
                                      label={statusLabels[order.status] ?? order.status}
                                    />
                                    <p className="text-sm text-gold mt-1">
                                      {formatNumber(order.total, locale)} {currency}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {detail.notes[0] ? (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-ivory-faint mb-2">
                              {t("latestNote")}
                            </p>
                            <p className="text-sm text-ivory-muted leading-relaxed border-s-2 border-gold/30 ps-3">
                              {detail.notes[0].content}
                            </p>
                          </div>
                        ) : null}

                        {detail.feedback[0] ? (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-ivory-faint mb-2">
                              {t("latestFeedback")}
                            </p>
                            <div className="rounded-sm border border-gold-glow/10 bg-void/40 p-3">
                              {detail.feedback[0].rating ? (
                                <Stars rating={detail.feedback[0].rating} />
                              ) : null}
                              <p className="text-sm text-ivory-muted mt-2">{detail.feedback[0].comment}</p>
                            </div>
                          </div>
                        ) : null}
                      </motion.div>
                    ) : null}

                    {detailTab === "orders" ? (
                      <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3"
                      >
                        {detail.orders.length === 0 ? (
                          <p className="text-sm text-ivory-muted">{t("noOrdersYet")}</p>
                        ) : (
                          detail.orders.map((order) => (
                            <article
                              key={order.id}
                              className="rounded-sm border border-gold-glow/10 bg-void/40 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-serif text-lg text-ivory">{order.orderNumber}</p>
                                  <p className="text-xs text-ivory-faint mt-1">
                                    {formatDate(order.createdAt, locale, true)} ·{" "}
                                    {order.paymentMethod === "COD" ? t("paymentCod") : t("paymentStripe")} ·{" "}
                                    {formatNumber(order.itemCount, locale)} {t("items")}
                                  </p>
                                  <p className="text-sm text-ivory-muted mt-2">{order.itemSummary}</p>
                                </div>
                                <div className="text-end">
                                  <OrderStatusBadge
                                    status={order.status}
                                    label={statusLabels[order.status] ?? order.status}
                                  />
                                  <p className="font-serif text-xl text-gold mt-2">
                                    {formatNumber(order.total, locale)} {currency}
                                  </p>
                                </div>
                              </div>
                              {order.notes ? (
                                <div className="mt-3 pt-3 border-t border-gold-glow/10">
                                  <p className="text-[10px] uppercase tracking-wider text-ivory-faint mb-1">
                                    {t("checkoutNote")}
                                  </p>
                                  <p className="text-sm text-ivory-muted">{order.notes}</p>
                                </div>
                              ) : null}
                            </article>
                          ))
                        )}
                      </motion.div>
                    ) : null}

                    {detailTab === "notes" ? (
                      <motion.div
                        key="notes"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="rounded-sm border border-gold-glow/15 bg-void/50 p-4">
                          <label className="text-[10px] uppercase tracking-wider text-ivory-faint block mb-2">
                            {t("addNote")}
                          </label>
                          <textarea
                            value={noteDraft}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            rows={3}
                            placeholder={t("notePlaceholder")}
                            className="w-full bg-obsidian border border-gold-glow/20 rounded-sm px-3 py-2.5 text-sm text-ivory resize-y min-h-[80px]"
                          />
                          <button
                            type="button"
                            disabled={busy || !noteDraft.trim()}
                            onClick={() => void handleAddNote()}
                            className="mt-3 inline-flex items-center justify-center px-4 py-2.5 rounded-sm text-xs font-semibold bg-gold text-[#0E0D12] disabled:opacity-50"
                          >
                            {busy ? t("saving") : t("saveNote")}
                          </button>
                        </div>

                        {detail.notes.length === 0 ? (
                          <p className="text-sm text-ivory-muted">{t("noNotes")}</p>
                        ) : (
                          <ul className="space-y-3">
                            {detail.notes.map((note) => (
                              <li
                                key={note.id}
                                className="rounded-sm border border-gold-glow/10 bg-void/30 p-4"
                              >
                                <p className="text-sm text-ivory leading-relaxed">{note.content}</p>
                                <p className="text-xs text-ivory-faint mt-2">
                                  {note.authorName} · {formatDate(note.createdAt, locale, true)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ) : null}

                    {detailTab === "feedback" ? (
                      <motion.div
                        key="feedback"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="rounded-sm border border-gold-glow/15 bg-void/50 p-4">
                          <label className="text-[10px] uppercase tracking-wider text-ivory-faint block mb-2">
                            {t("addFeedback")}
                          </label>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setFeedbackRating(value)}
                                className={`text-lg transition-opacity ${
                                  feedbackRating && value <= feedbackRating
                                    ? "text-gold opacity-100"
                                    : "text-gold opacity-25"
                                }`}
                                aria-label={`${value} stars`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={feedbackDraft}
                            onChange={(event) => setFeedbackDraft(event.target.value)}
                            rows={3}
                            placeholder={t("feedbackPlaceholder")}
                            className="w-full bg-obsidian border border-gold-glow/20 rounded-sm px-3 py-2.5 text-sm text-ivory resize-y min-h-[80px]"
                          />
                          <button
                            type="button"
                            disabled={busy || !feedbackDraft.trim()}
                            onClick={() => void handleAddFeedback()}
                            className="mt-3 inline-flex items-center justify-center px-4 py-2.5 rounded-sm text-xs font-semibold bg-gold text-[#0E0D12] disabled:opacity-50"
                          >
                            {busy ? t("saving") : t("saveFeedback")}
                          </button>
                        </div>

                        {detail.feedback.length === 0 ? (
                          <p className="text-sm text-ivory-muted">{t("noFeedback")}</p>
                        ) : (
                          <ul className="space-y-3">
                            {detail.feedback.map((entry) => (
                              <li
                                key={entry.id}
                                className="rounded-sm border border-gold-glow/10 bg-void/30 p-4"
                              >
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {entry.rating ? <Stars rating={entry.rating} /> : null}
                                  <span className="text-[10px] uppercase tracking-wider text-ivory-faint">
                                    {feedbackSourceLabel(entry.source)}
                                  </span>
                                  {entry.orderNumber ? (
                                    <span className="text-xs text-gold">{entry.orderNumber}</span>
                                  ) : null}
                                </div>
                                <p className="text-sm text-ivory leading-relaxed">{entry.comment}</p>
                                <p className="text-xs text-ivory-faint mt-2">
                                  {formatDate(entry.createdAt, locale, true)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
