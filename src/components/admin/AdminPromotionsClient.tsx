"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  type AdminPromotion,
  deletePromotion,
  setPromotionActive,
} from "@/server/promotions";
import { formatDiscountLabel } from "@/lib/pricing";
import PromotionFormModal from "@/components/admin/PromotionFormModal";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import Button from "@/components/ui/Button";
import { useAppToast } from "@/hooks/useAppToast";
import { formatNumber } from "@/lib/format";

type Filter = "all" | "live" | "codes" | "sales" | "scheduled";

type Props = {
  promotions: AdminPromotion[];
  collections: { id: string; nameAr: string; nameEn: string }[];
  products: { id: string; nameAr: string; nameEn: string; collectionId: string | null }[];
};

function formatWindow(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminPromotionsClient({ promotions, collections, products }: Props) {
  const t = useTranslations("Admin.Promotions");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { adminSuccess, adminError } = useAppToast();

  const [rows, setRows] = useState(promotions);
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPromotion | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const live = rows.filter((row) => row.status === "live").length;
    const codes = rows.filter((row) => row.code).length;
    const sales = rows.filter((row) => !row.code).length;
    return { total: rows.length, live, codes, sales };
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "live") return rows.filter((row) => row.status === "live");
    if (filter === "codes") return rows.filter((row) => row.code);
    if (filter === "sales") return rows.filter((row) => !row.code);
    if (filter === "scheduled") return rows.filter((row) => row.status === "scheduled");
    return rows;
  }, [filter, rows]);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (type === "error") adminError(message);
    else adminSuccess(message);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(promotion: AdminPromotion) {
    setEditing(promotion);
    setFormOpen(true);
  }

  function handleSaved(promotion: AdminPromotion) {
    setRows((current) => {
      const exists = current.some((row) => row.id === promotion.id);
      if (exists) return current.map((row) => (row.id === promotion.id ? promotion : row));
      return [promotion, ...current];
    });
    showToast(t("saved"));
  }

  function handleError(error: string) {
    if (error === "duplicate") {
      showToast(t("errorDuplicate"), "error");
      return;
    }
    showToast(t("error"), "error");
  }

  async function handleToggle(promotion: AdminPromotion) {
    setBusyId(promotion.id);
    const result = await setPromotionActive(promotion.id, !promotion.active);
    setBusyId(null);
    if (!result.ok) {
      showToast(t("error"), "error");
      return;
    }
    setRows((current) => current.map((row) => (row.id === promotion.id ? result.promotion : row)));
    showToast(result.promotion.active ? t("activated") : t("paused"));
  }

  async function handleDelete() {
    if (!confirmId) return;
    setBusyId(confirmId);
    const result = await deletePromotion(confirmId);
    setBusyId(null);
    setConfirmId(null);
    if (!result.ok) {
      showToast(t("error"), "error");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== confirmId));
    showToast(t("deleted"));
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "live", label: t("filterLive") },
    { key: "codes", label: t("filterCodes") },
    { key: "sales", label: t("filterSales") },
    { key: "scheduled", label: t("filterScheduled") },
  ];

  function promotionVariant(status: AdminPromotion["status"]) {
    if (status === "live") return "live" as const;
    if (status === "scheduled") return "scheduled" as const;
    if (status === "exhausted") return "exhausted" as const;
    return "ended" as const;
  }

  function scopeLabel(promotion: AdminPromotion) {
    if (promotion.scope === "ORDER") return t("scopeOrder");
    if (promotion.scope === "COLLECTION") {
      const name = isArabic ? promotion.collectionNameAr : promotion.collectionNameEn;
      return name ? `${t("scopeCollection")}: ${name}` : t("scopeCollection");
    }
    return `${t("scopeProduct")} (${formatNumber(promotion.targetCount, locale)})`;
  }

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm text-ivory-muted -mt-2">{t("subtitle")}</p>
          <p className="mt-2 text-xs text-ivory-faint max-w-2xl">{t("studioHint")}</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          {t("createCampaign")}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statTotal")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.total, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statLive")}</p>
          <p className="mt-2 font-serif text-2xl admin-stat-success">{formatNumber(stats.live, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statCodes")}</p>
          <p className="mt-2 font-serif text-2xl text-gold">{formatNumber(stats.codes, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statSales")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.sales, locale)}</p>
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
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-dashed border-gold-glow/20 bg-obsidian/40 px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ivory mb-2">{t("emptyTitle")}</p>
          <p className="text-sm text-ivory-muted mb-6">{t("empty")}</p>
          <Button onClick={openCreate}>{t("createCampaign")}</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((promotion) => {
            const name = isArabic ? promotion.nameAr : promotion.nameEn;
            const discountLabel = formatDiscountLabel(
              promotion.discountType,
              promotion.discountValue,
              locale
            );
            const usagePercent =
              promotion.usageLimit != null && promotion.usageLimit > 0
                ? Math.min(100, Math.round((promotion.usageCount / promotion.usageLimit) * 100))
                : null;

            return (
              <motion.article
                key={promotion.id}
                layout
                className="relative overflow-hidden rounded-sm border border-gold-glow/15 bg-obsidian p-5"
              >
                {promotion.status === "live" ? (
                  <span className="absolute top-0 end-0 h-16 w-16 bg-gradient-to-bl from-success/15 to-transparent pointer-events-none" />
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <AdminStatusBadge
                        variant={promotionVariant(promotion.status)}
                        label={t(`status_${promotion.status}`)}
                      />
                      <span className="text-[10px] uppercase tracking-wider text-ivory-faint">
                        {promotion.code ? t("typeCode") : t("typeSale")}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-ivory truncate">{name}</h3>
                    {promotion.code ? (
                      <p className="mt-1 font-mono text-sm text-gold tracking-[0.18em]" dir="ltr">
                        {promotion.code}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-serif text-2xl text-gold">{discountLabel}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-ivory-faint">
                      {scopeLabel(promotion)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-ivory-faint">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ivory-faint/80">{t("startsAt")}</p>
                    <p className="mt-1 text-ivory-muted">{formatWindow(promotion.startsAt as string | null, locale)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ivory-faint/80">{t("endsAt")}</p>
                    <p className="mt-1 text-ivory-muted">{formatWindow(promotion.endsAt as string | null, locale)}</p>
                  </div>
                </div>

                {usagePercent != null ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-ivory-faint mb-1.5">
                      <span>{t("usage")}</span>
                      <span>
                        {formatNumber(promotion.usageCount, locale)} / {formatNumber(promotion.usageLimit!, locale)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-void overflow-hidden">
                      <div className="h-full bg-gold transition-all" style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(promotion)}
                    className="px-3 py-1.5 text-xs border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === promotion.id}
                    onClick={() => void handleToggle(promotion)}
                    className="px-3 py-1.5 text-xs border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold disabled:opacity-50"
                  >
                    {promotion.active ? t("pause") : t("activate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(promotion.id)}
                    className="px-3 py-1.5 text-xs border border-red-400/30 rounded-sm text-red-300 hover:bg-red-500/10"
                  >
                    {t("delete")}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <PromotionFormModal
        open={formOpen}
        promotion={editing}
        collections={collections}
        products={products}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onError={handleError}
      />

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-void/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-gold-glow/20 bg-obsidian p-6">
            <h3 className="font-serif text-xl text-ivory">{t("confirmDeleteTitle")}</h3>
            <p className="mt-2 text-sm text-ivory-muted">{t("confirmDeleteBody")}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setConfirmId(null)} className="flex-1">
                {t("cancel")}
              </Button>
              <Button
                onClick={() => void handleDelete()}
                disabled={busyId === confirmId}
                className="flex-1 !bg-red-500/20 !text-red-200 !border-red-400/30"
              >
                {t("confirmDeleteAction")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
