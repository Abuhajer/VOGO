"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  type AdminCollection,
  deleteCollection,
  moveCollection,
  setCollectionActive,
} from "@/server/collection-actions";
import { localizeCollectionName } from "@/lib/collections";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTableScroll from "@/components/admin/AdminTableScroll";
import CollectionFormModal from "@/components/admin/CollectionFormModal";
import Button from "@/components/ui/Button";
import { useAppToast } from "@/hooks/useAppToast";
import { formatNumber } from "@/lib/format";

type Filter = "all" | "active" | "inactive";

type Props = {
  collections: AdminCollection[];
};

export default function AdminCollectionsClient({ collections }: Props) {
  const t = useTranslations("Admin.Collections");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { adminSuccess, adminError } = useAppToast();

  const [rows, setRows] = useState(
    [...collections].sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn))
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCollection | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
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
      products: rows.reduce((sum, row) => sum + row.productCount, 0),
    }),
    [rows]
  );

  function sortRows(list: AdminCollection[]) {
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn));
  }

  function showToast(message: string, type: "success" | "error" = "success") {
    if (type === "error") adminError(message);
    else adminSuccess(message);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(collection: AdminCollection) {
    setEditing(collection);
    setFormOpen(true);
  }

  function handleSaved(collection: AdminCollection) {
    setRows((current) => {
      const exists = current.some((row) => row.id === collection.id);
      if (exists) {
        return sortRows(current.map((row) => (row.id === collection.id ? collection : row)));
      }
      return sortRows([collection, ...current]);
    });
    showToast(t("saved"));
  }

  function handleError(error: string) {
    if (error === "duplicate") {
      showToast(t("errorDuplicate"), "error");
      return;
    }
    if (error === "has_products") {
      showToast(t("errorHasProducts"), "error");
      return;
    }
    showToast(t("error"), "error");
  }

  async function handleToggleActive(collection: AdminCollection) {
    setBusyId(collection.id);
    const result = await setCollectionActive(collection.id, !collection.active);
    setBusyId(null);

    if (!result.ok) {
      showToast(t("error"), "error");
      return;
    }

    setRows((current) =>
      sortRows(current.map((row) => (row.id === collection.id ? result.collection : row)))
    );
    showToast(result.collection.active ? t("restored") : t("hidden"));
  }

  async function handleMove(collection: AdminCollection, direction: "up" | "down") {
    setBusyId(collection.id);
    const result = await moveCollection(collection.id, direction);
    setBusyId(null);

    if (!result.ok) {
      showToast(t("error"), "error");
      return;
    }

    setRows((current) => {
      const sorted = sortRows(current);
      const index = sorted.findIndex((row) => row.id === collection.id);
      const neighborIndex = direction === "up" ? index - 1 : index + 1;
      if (neighborIndex < 0 || neighborIndex >= sorted.length) {
        return sortRows(
          current.map((row) => (row.id === collection.id ? result.collection : row))
        );
      }

      const neighbor = sorted[neighborIndex];
      return sortRows(
        current.map((row) => {
          if (row.id === collection.id) return { ...row, sortOrder: neighbor.sortOrder };
          if (row.id === neighbor.id) return { ...row, sortOrder: collection.sortOrder };
          return row;
        })
      );
    });
    showToast(t("orderUpdated"));
  }

  async function handleConfirmDelete() {
    if (!confirmId) return;

    setBusyId(confirmId);
    const result = await deleteCollection(confirmId);
    setBusyId(null);
    setConfirmId(null);

    if (!result.ok) {
      if (result.error === "has_products") {
        showToast(t("errorHasProducts"), "error");
        return;
      }
      showToast(t("error"), "error");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== confirmId));
    showToast(t("deleted"));
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("filterAll"), count: stats.total },
    { key: "active", label: t("filterActive"), count: stats.active },
    { key: "inactive", label: t("filterInactive"), count: stats.inactive },
  ];

  return (
    <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <p className="text-sm text-ivory-muted -mt-2">{t("subtitle")}</p>
        <Button onClick={openCreate} className="shrink-0">
          {t("addCategory")}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statTotal")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.total, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statActive")}</p>
          <p className="mt-2 font-serif text-2xl text-gold">{formatNumber(stats.active, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statHidden")}</p>
          <p className="mt-2 font-serif text-2xl text-ivory">{formatNumber(stats.inactive, locale)}</p>
        </div>
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("statProducts")}</p>
          <p className="mt-2 font-serif text-2xl admin-stat-success">{formatNumber(stats.products, locale)}</p>
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
          <p className="text-sm text-ivory-muted mb-6">{t("empty")}</p>
          <Button onClick={openCreate}>{t("addCategory")}</Button>
        </div>
      ) : (
        <AdminTableScroll hint={locale === "ar" ? "اسحب لعرض المزيد ←" : "Swipe to see more →"}>
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-gold-glow/10 text-[11px] uppercase tracking-wider text-ivory-faint">
                  <th className="px-4 py-3 text-start font-normal w-16">{t("order")}</th>
                  <th className="px-4 py-3 text-start font-normal">{t("category")}</th>
                  <th className="px-4 py-3 text-start font-normal hidden md:table-cell">{t("slug")}</th>
                  <th className="px-4 py-3 text-start font-normal">{t("products")}</th>
                  <th className="px-4 py-3 text-start font-normal">{t("status")}</th>
                  <th className="px-4 py-3 text-end font-normal">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((collection, index) => {
                  const globalIndex = rows.findIndex((row) => row.id === collection.id);
                  const canMoveUp = globalIndex > 0;
                  const canMoveDown = globalIndex < rows.length - 1;

                  return (
                    <tr
                      key={collection.id}
                      className="border-b border-gold-glow/10 last:border-b-0 hover:bg-void/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!canMoveUp || busyId === collection.id}
                            onClick={() => void handleMove(collection, "up")}
                            className="p-1 text-ivory-faint hover:text-gold disabled:opacity-30"
                            aria-label={t("moveUp")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={!canMoveDown || busyId === collection.id}
                            onClick={() => void handleMove(collection, "down")}
                            className="p-1 text-ivory-faint hover:text-gold disabled:opacity-30"
                            aria-label={t("moveDown")}
                          >
                            ↓
                          </button>
                          <span className="text-xs text-ivory-faint ms-1">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-serif text-lg text-ivory">
                          {localizeCollectionName(collection, locale)}
                        </p>
                        <p className="text-xs text-ivory-faint mt-0.5 md:hidden" dir="ltr">
                          {collection.slug}
                        </p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <code className="text-xs text-ivory-muted" dir="ltr">
                          {collection.slug}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-ivory-muted">
                        {formatNumber(collection.productCount, locale)}
                      </td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge
                          variant={collection.active ? "active" : "inactive"}
                          label={collection.active ? t("active") : t("inactive")}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(collection)}
                            className="px-3 py-1.5 text-xs border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold transition-colors"
                          >
                            {t("edit")}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === collection.id}
                            onClick={() => void handleToggleActive(collection)}
                            className="px-3 py-1.5 text-xs border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold transition-colors disabled:opacity-50"
                          >
                            {collection.active ? t("hide") : t("show")}
                          </button>
                          {collection.productCount === 0 ? (
                            <button
                              type="button"
                              onClick={() => setConfirmId(collection.id)}
                              className="px-3 py-1.5 text-xs border border-red-400/30 rounded-sm text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                              {t("delete")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </AdminTableScroll>
      )}

      <CollectionFormModal
        open={formOpen}
        collection={editing}
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
                onClick={() => void handleConfirmDelete()}
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
