"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  type AdminProduct,
  deleteProduct,
  setProductActive,
} from "@/server/admin-actions";
import { localizeCollectionName } from "@/lib/collections";
import ProductFormModal from "@/components/admin/ProductFormModal";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/format";

type Filter = "all" | "active" | "inactive";

type AdminProductsClientProps = {
  products: AdminProduct[];
  collections: { id: string; nameAr: string; nameEn: string }[];
};

export default function AdminProductsClient({ products, collections }: AdminProductsClientProps) {
  const t = useTranslations("Admin.Products");
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [rows, setRows] = useState(products);
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.active);
    if (filter === "inactive") return rows.filter((row) => !row.active);
    return rows;
  }, [filter, rows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.active).length,
      inactive: rows.filter((row) => !row.active).length,
    }),
    [rows]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormOpen(true);
  }

  function handleSaved(product: AdminProduct) {
    setRows((current) => {
      const exists = current.some((row) => row.id === product.id);
      if (exists) {
        return current.map((row) => (row.id === product.id ? product : row));
      }
      return [product, ...current];
    });
    showToast(t("saved"));
  }

  function handleError(error: string) {
    if (error === "duplicate") {
      showToast(t("errorDuplicate"));
      return;
    }
    showToast(t("error"));
  }

  async function handleToggleActive(product: AdminProduct) {
    setBusyId(product.id);
    const result = await setProductActive(product.id, !product.active);
    setBusyId(null);

    if (!result.ok) {
      showToast(t("error"));
      return;
    }

    setRows((current) => current.map((row) => (row.id === product.id ? result.product : row)));
    showToast(result.product.active ? t("restored") : t("removed"));
  }

  async function handleConfirmRemove() {
    if (!confirmId) return;

    setBusyId(confirmId);
    const result = await deleteProduct(confirmId);
    setBusyId(null);
    setConfirmId(null);

    if (!result.ok) {
      showToast(t("error"));
      return;
    }

    setRows((current) => current.map((row) => (row.id === result.product.id ? result.product : row)));
    showToast(t("removed"));
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("filterAll"), count: stats.total },
    { key: "active", label: t("filterActive"), count: stats.active },
    { key: "inactive", label: t("filterInactive"), count: stats.inactive },
  ];

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-sm text-xs uppercase tracking-wider border transition-colors ${
                filter === item.key
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-gold-glow/15 text-ivory-muted hover:text-ivory"
              }`}
            >
              {item.label} ({formatNumber(item.count, locale)})
            </button>
          ))}
        </div>
        <Button onClick={openCreate} isArabic={isArabic} className="self-start sm:self-auto shrink-0">
          {t("addProduct")}
        </Button>
      </div>

      {toast ? (
        <div
          role="status"
          className="mb-6 rounded-sm border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold"
        >
          {toast}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ivory mb-3">{t("emptyTitle")}</p>
          <p className="text-sm text-ivory-muted mb-8 max-w-md mx-auto">{t("empty")}</p>
          <Button onClick={openCreate} isArabic={isArabic}>
            {t("addProduct")}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-gold-glow/15">
          <table className="min-w-full text-sm">
            <thead className="bg-void/80 text-[11px] uppercase tracking-wider text-ivory-faint">
              <tr>
                <th className="px-4 py-3 text-start font-normal">{t("product")}</th>
                <th className="px-4 py-3 text-start font-normal hidden md:table-cell">{t("collection")}</th>
                <th className="px-4 py-3 text-start font-normal hidden lg:table-cell">{t("sku")}</th>
                <th className="px-4 py-3 text-start font-normal">{t("price")}</th>
                <th className="px-4 py-3 text-start font-normal">{t("status")}</th>
                <th className="px-4 py-3 text-end font-normal">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-gold-glow/10 bg-obsidian/60 hover:bg-obsidian transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4 min-w-[220px]">
                      <div className="relative h-16 w-12 rounded-sm overflow-hidden border border-gold-glow/10 shrink-0">
                        <Image
                          src={product.imageSrc}
                          alt={product.nameEn}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-serif text-ivory">{product.nameEn}</p>
                        <p className="text-xs text-ivory-muted mt-1" dir="rtl">
                          {product.nameAr}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-ivory-muted">
                    {product.collection
                      ? localizeCollectionName(product.collection, locale)
                      : t("noCollection")}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell text-ivory-muted" dir="ltr">
                    {product.sku}
                  </td>
                  <td className="px-4 py-4 text-gold whitespace-nowrap">
                    {formatNumber(product.price, locale)} {isArabic ? "د.أ" : "JOD"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider ${
                        product.active
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-ivory-faint/10 text-ivory-faint border border-ivory-faint/20"
                      }`}
                    >
                      {product.active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="px-3 py-2 text-[11px] border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold"
                      >
                        {t("view")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="px-3 py-2 text-[11px] border border-gold-glow/20 rounded-sm text-ivory hover:text-gold"
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() =>
                          product.active ? setConfirmId(product.id) : handleToggleActive(product)
                        }
                        className="px-3 py-2 text-[11px] border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold disabled:opacity-50"
                      >
                        {product.active ? t("remove") : t("restore")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        product={editing}
        collections={collections}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onError={handleError}
      />

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#050508]/85 backdrop-blur-sm"
            onClick={() => setConfirmId(null)}
            aria-label={t("cancel")}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-sm border border-gold-glow/20 bg-obsidian p-6 shadow-2xl"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h3 className="font-serif text-2xl text-ivory">{t("confirmRemoveTitle")}</h3>
            <p className="mt-3 text-sm text-ivory-muted">{t("confirmRemoveBody")}</p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmId(null)} isArabic={isArabic}>
                {t("cancel")}
              </Button>
              <button
                type="button"
                disabled={busyId === confirmId}
                onClick={handleConfirmRemove}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {t("confirmRemoveAction")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
