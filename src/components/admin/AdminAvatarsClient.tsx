"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  type AdminAvatar,
  deleteAvatar,
  reorderAvatar,
  setAvatarActive,
} from "@/server/fitting-room-avatars";
import AvatarFormModal from "@/components/admin/AvatarFormModal";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTableScroll from "@/components/admin/AdminTableScroll";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/format";

type Filter = "all" | "active" | "inactive";

type AdminAvatarsClientProps = {
  avatars: AdminAvatar[];
};

export default function AdminAvatarsClient({ avatars }: AdminAvatarsClientProps) {
  const t = useTranslations("Admin.Avatars");
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [rows, setRows] = useState(avatars);
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAvatar | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmHideId, setConfirmHideId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [rows]
  );

  const filtered = useMemo(() => {
    if (filter === "active") return sortedRows.filter((row) => row.active);
    if (filter === "inactive") return sortedRows.filter((row) => !row.active);
    return sortedRows;
  }, [filter, sortedRows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.active).length,
      inactive: rows.filter((row) => !row.active).length,
    }),
    [rows]
  );

  const nextSortOrder = useMemo(() => {
    if (rows.length === 0) return 1;
    return Math.max(...rows.map((row) => row.sortOrder)) + 1;
  }, [rows]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(avatar: AdminAvatar) {
    setEditing(avatar);
    setFormOpen(true);
  }

  function handleSaved(avatar: AdminAvatar) {
    setRows((current) => {
      const exists = current.some((row) => row.id === avatar.id);
      if (exists) {
        return current.map((row) => (row.id === avatar.id ? avatar : row));
      }
      return [...current, avatar];
    });
    showToast(t("saved"));
  }

  function handleError(error: string) {
    if (error === "duplicate") {
      showToast(t("errorDuplicate"));
      return;
    }
    if (error === "upload") {
      showToast(t("errorUpload"));
      return;
    }
    showToast(t("error"));
  }

  async function handleToggleActive(avatar: AdminAvatar) {
    setBusyId(avatar.id);
    const result = await setAvatarActive(avatar.id, !avatar.active);
    setBusyId(null);

    if (!result.ok) {
      showToast(t("error"));
      return;
    }

    setRows((current) => current.map((row) => (row.id === avatar.id ? result.avatar : row)));
    showToast(result.avatar.active ? t("restored") : t("hidden"));
  }

  async function handleConfirmHide() {
    if (!confirmHideId) return;
    const avatar = rows.find((row) => row.id === confirmHideId);
    if (!avatar) return;
    setConfirmHideId(null);
    await handleToggleActive(avatar);
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;

    setBusyId(confirmDeleteId);
    const result = await deleteAvatar(confirmDeleteId);
    setBusyId(null);
    setConfirmDeleteId(null);

    if (!result.ok) {
      showToast(t("error"));
      return;
    }

    setRows((current) => current.filter((row) => row.id !== confirmDeleteId));
    showToast(t("deleted"));
  }

  async function handleReorder(avatar: AdminAvatar, direction: "up" | "down") {
    setBusyId(avatar.id);
    const result = await reorderAvatar(avatar.id, direction);
    setBusyId(null);

    if (!result.ok) {
      showToast(t("error"));
      return;
    }

    const index = sortedRows.findIndex((row) => row.id === avatar.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= sortedRows.length) return;

    const neighbor = sortedRows[swapIndex];
    setRows((current) =>
      current.map((row) => {
        if (row.id === avatar.id) return { ...row, sortOrder: neighbor.sortOrder };
        if (row.id === neighbor.id) return { ...row, sortOrder: avatar.sortOrder };
        return row;
      })
    );
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
          {t("addAvatar")}
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
            {t("addAvatar")}
          </Button>
        </div>
      ) : (
        <AdminTableScroll hint={locale === "ar" ? "اسحب لعرض المزيد ←" : "Swipe to see more →"}>
          <table className="min-w-full text-sm">
            <thead className="bg-void/80 text-[11px] uppercase tracking-wider text-ivory-faint">
              <tr>
                <th className="px-4 py-3 text-start font-normal">{t("avatar")}</th>
                <th className="px-4 py-3 text-start font-normal hidden md:table-cell">{t("slug")}</th>
                <th className="px-4 py-3 text-start font-normal">{t("sortOrder")}</th>
                <th className="px-4 py-3 text-start font-normal">{t("status")}</th>
                <th className="px-4 py-3 text-end font-normal">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((avatar, index) => (
                <tr
                  key={avatar.id}
                  className="border-t border-gold-glow/10 bg-obsidian/60 hover:bg-obsidian transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="relative h-16 w-9 rounded-sm overflow-hidden border border-gold-glow/10 shrink-0">
                        <Image
                          src={avatar.imageSrc}
                          alt={avatar.labelEn}
                          fill
                          sizes="36px"
                          className="object-cover object-top"
                          unoptimized={avatar.imageSrc.startsWith("data:")}
                        />
                      </div>
                      <div>
                        <p className="font-serif text-ivory">{avatar.labelEn}</p>
                        <p className="text-xs text-ivory-muted mt-1" dir="rtl">
                          {avatar.labelAr}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-ivory-muted" dir="ltr">
                    {avatar.slug}
                  </td>
                  <td className="px-4 py-4 text-ivory-muted whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>{formatNumber(avatar.sortOrder, locale)}</span>
                      <button
                        type="button"
                        disabled={busyId === avatar.id || index === 0}
                        onClick={() => void handleReorder(avatar, "up")}
                        className="px-2 py-1 text-[10px] border border-gold-glow/20 rounded-sm disabled:opacity-30"
                        aria-label={t("moveUp")}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={busyId === avatar.id || index === filtered.length - 1}
                        onClick={() => void handleReorder(avatar, "down")}
                        className="px-2 py-1 text-[10px] border border-gold-glow/20 rounded-sm disabled:opacity-30"
                        aria-label={t("moveDown")}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <AdminStatusBadge
                      variant={avatar.active ? "active" : "inactive"}
                      label={avatar.active ? t("active") : t("inactive")}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(avatar)}
                        className="px-3 py-2 text-[11px] border border-gold-glow/20 rounded-sm text-ivory hover:text-gold"
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === avatar.id}
                        onClick={() =>
                          avatar.active ? setConfirmHideId(avatar.id) : handleToggleActive(avatar)
                        }
                        className="px-3 py-2 text-[11px] border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold disabled:opacity-50"
                      >
                        {avatar.active ? t("hide") : t("restore")}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === avatar.id}
                        onClick={() => setConfirmDeleteId(avatar.id)}
                        className="px-3 py-2 text-[11px] border border-red-400/30 rounded-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableScroll>
      )}

      <AvatarFormModal
        open={formOpen}
        avatar={editing}
        nextSortOrder={nextSortOrder}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onError={handleError}
      />

      {confirmHideId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#050508]/85 backdrop-blur-sm"
            onClick={() => setConfirmHideId(null)}
            aria-label={t("cancel")}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-sm border border-gold-glow/20 bg-obsidian p-6 shadow-2xl"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h3 className="font-serif text-2xl text-ivory">{t("confirmHideTitle")}</h3>
            <p className="mt-3 text-sm text-ivory-muted">{t("confirmHideBody")}</p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmHideId(null)} isArabic={isArabic}>
                {t("cancel")}
              </Button>
              <button
                type="button"
                disabled={busyId === confirmHideId}
                onClick={() => void handleConfirmHide()}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 border border-gold-glow/30 text-ivory hover:text-gold disabled:opacity-50"
              >
                {t("confirmHideAction")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#050508]/85 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
            aria-label={t("cancel")}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-sm border border-gold-glow/20 bg-obsidian p-6 shadow-2xl"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h3 className="font-serif text-2xl text-ivory">{t("confirmDeleteTitle")}</h3>
            <p className="mt-3 text-sm text-ivory-muted">{t("confirmDeleteBody")}</p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} isArabic={isArabic}>
                {t("cancel")}
              </Button>
              <button
                type="button"
                disabled={busyId === confirmDeleteId}
                onClick={() => void handleConfirmDelete()}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {t("confirmDeleteAction")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
