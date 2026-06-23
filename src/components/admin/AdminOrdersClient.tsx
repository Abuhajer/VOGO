"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { updateOrderStatus } from "@/server/orders";
import { OrderStatus } from "@/types/db";
import {
  ORDER_STATUS_PIPELINE,
  canCancelOrder,
  getAllowedOrderStatuses,
  getNextPipelineStatus,
  isOrderStatusLocked,
  isValidOrderStatusTransition,
} from "@/lib/order-status";
import { isRevenueOrderStatus } from "@/lib/order-revenue";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import OrderStatusStepper from "@/components/admin/OrderStatusStepper";
import { useAppToast } from "@/hooks/useAppToast";
import { formatNumber } from "@/lib/format";
import PhoneText from "@/components/form/PhoneText";

type OrderItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  sizeCode?: string | null;
  sizeLabelEn?: string | null;
  sizeLabelAr?: string | null;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  promoCode: string | null;
  notes: string | null;
  total: number;
  createdAt: string | Date;
  items: OrderItem[];
};

type Filter = "all" | OrderStatus;

type AdminOrdersClientProps = {
  orders: AdminOrder[];
  statusLabels: Record<string, string>;
};

function formatOrderDate(value: string | Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminOrdersClient({ orders, statusLabels }: AdminOrdersClientProps) {
  const t = useTranslations("Admin.Orders");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currency = isArabic ? "د.أ" : "JOD";
  const { adminSuccess, adminError } = useAppToast();

  const [rows, setRows] = useState(orders);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(
      Object.values(OrderStatus).map((s) => [s, 0])
    ) as Record<string, number>;
    let revenue = 0;
    for (const order of rows) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
      if (isRevenueOrderStatus(order.status)) revenue += order.total;
    }
    return {
      total: rows.length,
      pending: counts[OrderStatus.PENDING] ?? 0,
      active: rows.filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.DELIVERED).length,
      revenue,
      counts,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((order) => order.status === filter);
  }, [filter, rows]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("filterAll"), count: stats.total },
    ...ORDER_STATUS_PIPELINE.map((status) => ({
      key: status as Filter,
      label: statusLabels[status] ?? status,
      count: stats.counts[status] ?? 0,
    })),
    {
      key: OrderStatus.CANCELLED as Filter,
      label: statusLabels.CANCELLED,
      count: stats.counts[OrderStatus.CANCELLED] ?? 0,
    },
  ];

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    const order = rows.find((entry) => entry.id === orderId);
    if (order && !isValidOrderStatusTransition(order.status, status)) {
      adminError(t("statusLockedError"));
      return;
    }

    setBusyId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setRows((current) =>
        current.map((entry) => (entry.id === orderId ? { ...entry, status } : entry))
      );
      adminSuccess(t("statusUpdated"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      adminError(message === "ORDER_STATUS_LOCKED" ? t("statusLockedError") : t("statusError"));
    } finally {
      setBusyId(null);
    }
  }

  function itemSummary(order: AdminOrder) {
    const names = order.items.map((item) =>
      isArabic ? item.nameAr : item.nameEn
    );
    if (names.length === 0) return "—";
    if (names.length <= 2) return names.join(isArabic ? " ، " : ", ");
    return `${names.slice(0, 2).join(isArabic ? " ، " : ", ")} +${names.length - 2}`;
  }

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statTotal")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.total, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statPending")}</p>
          <p className="mt-2 font-serif text-2xl text-gold">{formatNumber(stats.pending, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statActive")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.active, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statRevenue")}</p>
          <p className="mt-2 font-serif text-2xl admin-stat-success">
            {formatNumber(stats.revenue, locale)} {currency}
          </p>
        </div>
      </div>

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
            {item.label} ({formatNumber(item.count, locale)})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ivory mb-2">{t("emptyTitle")}</p>
          <p className="text-sm text-ivory-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((order) => {
              const nextStatus = getNextPipelineStatus(order.status, {
                paymentMethod: order.paymentMethod,
              });
              const expanded = expandedId === order.id;
              const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
              const locked = isOrderStatusLocked(order.status);
              const allowedStatuses = getAllowedOrderStatuses(order.status);

              return (
                <motion.article
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-sm border border-gold-glow/15 bg-obsidian overflow-hidden"
                >
                  <div className="p-4 md:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-serif text-lg text-ivory">{order.orderNumber}</h3>
                          <OrderStatusBadge
                            status={order.status}
                            label={statusLabels[order.status] ?? order.status}
                          />
                        </div>
                        <p className="text-sm text-ivory">{order.customerName}</p>
                        <p className="text-xs text-ivory-muted mt-1">
                          <span dir="ltr">{order.customerEmail}</span>
                          {" · "}
                          <PhoneText value={order.customerPhone} className="inline" />
                        </p>
                        <p className="text-xs text-ivory-faint mt-2">
                          {formatOrderDate(order.createdAt, locale)} ·{" "}
                          {order.paymentMethod === "COD" ? t("paymentCod") : t("paymentStripe")} ·{" "}
                          {formatNumber(itemCount, locale)} {t("items")}
                        </p>
                        <p className="text-sm text-ivory-muted mt-2 line-clamp-1">{itemSummary(order)}</p>
                      </div>

                      <div className="text-start lg:text-end shrink-0">
                        <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("total")}</p>
                        <p className="font-serif text-2xl text-gold mt-1">
                          {formatNumber(order.total, locale)} {currency}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-gold-glow/10">
                      <p className="text-[10px] uppercase tracking-wider text-ivory-faint mb-3">
                        {t("fulfillmentFlow")}
                      </p>
                      <OrderStatusStepper status={order.status} statusLabels={statusLabels} />
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                      {nextStatus ? (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => handleStatusChange(order.id, nextStatus)}
                          className="inline-flex items-center justify-center px-4 py-2.5 rounded-sm text-xs font-semibold bg-gold text-[#0E0D12] hover:shadow-[0_0_20px_rgba(201,168,76,0.25)] disabled:opacity-50 transition-all"
                        >
                          {busyId === order.id
                            ? t("updating")
                            : t("advanceTo", {
                                status: statusLabels[nextStatus] ?? nextStatus,
                              })}
                        </button>
                      ) : null}

                      <select
                        value={order.status}
                        disabled={busyId === order.id || locked}
                        onChange={(event) =>
                          handleStatusChange(order.id, event.target.value as OrderStatus)
                        }
                        className="bg-void border border-gold-glow/20 rounded-sm px-3 py-2.5 text-xs text-ivory min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label={t("setStatus")}
                      >
                        {allowedStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status] ?? status}
                          </option>
                        ))}
                      </select>

                      {canCancelOrder(order.status) ? (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => handleStatusChange(order.id, OrderStatus.CANCELLED)}
                          className="inline-flex items-center justify-center px-4 py-2.5 rounded-sm text-xs border border-red-400/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                        >
                          {t("cancelOrder")}
                        </button>
                      ) : locked ? (
                        <p className="self-center text-xs text-ivory-faint">{t("orderFinalized")}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-sm text-xs border border-gold-glow/20 text-ivory-muted hover:text-gold transition-colors sm:ms-auto"
                      >
                        {expanded ? t("hideDetails") : t("viewDetails")}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gold-glow/10 bg-void/40"
                      >
                        <div className="p-4 md:p-5 space-y-4">
                          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">
                            {t("lineItems")}
                          </p>
                          {(order.discountAmount > 0 || order.promoCode || order.notes) ? (
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <div className="rounded-sm border border-gold-glow/10 bg-obsidian/60 px-3 py-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("subtotal")}</p>
                                <p className="mt-1 text-ivory">
                                  {formatNumber(order.subtotal, locale)} {currency}
                                </p>
                              </div>
                              {order.discountAmount > 0 ? (
                                <div className="rounded-sm border border-gold-glow/10 bg-obsidian/60 px-3 py-2.5">
                                  <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("discount")}</p>
                                  <p className="mt-1 text-success">
                                    −{formatNumber(order.discountAmount, locale)} {currency}
                                    {order.promoCode ? ` (${order.promoCode})` : ""}
                                  </p>
                                </div>
                              ) : null}
                              {order.notes ? (
                                <div className="sm:col-span-2 rounded-sm border border-gold-glow/10 bg-obsidian/60 px-3 py-2.5">
                                  <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("customerNotes")}</p>
                                  <p className="mt-1 text-ivory-muted leading-relaxed">{order.notes}</p>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          <ul className="space-y-2">
                            {order.items.map((item) => {
                              const sizeLabel = isArabic ? item.sizeLabelAr : item.sizeLabelEn;
                              return (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-4 text-sm border border-gold-glow/10 rounded-sm px-3 py-2.5 bg-obsidian/60"
                              >
                                <span className="text-ivory">
                                  {isArabic ? item.nameAr : item.nameEn}
                                  {sizeLabel || item.sizeCode ? (
                                    <span className="text-ivory-faint ms-2">
                                      · {sizeLabel ?? item.sizeCode}
                                    </span>
                                  ) : null}
                                  <span className="text-ivory-faint ms-2">×{item.quantity}</span>
                                </span>
                                <span className="text-gold shrink-0" dir="ltr">
                                  {formatNumber(item.unitPrice * item.quantity, locale)} {currency}
                                </span>
                              </li>
                            );
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
