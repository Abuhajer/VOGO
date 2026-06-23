"use client";

import { useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AdminCollection,
  type CollectionFormInput,
  getNextCollectionSortOrder,
  upsertCollection,
} from "@/server/collection-actions";
import { emptyCollectionForm, slugifyCollectionName } from "@/lib/collections";
import Button from "@/components/ui/Button";

type CollectionFormModalProps = {
  open: boolean;
  collection: AdminCollection | null;
  onClose: () => void;
  onSaved: (collection: AdminCollection) => void;
  onError: (key: string) => void;
};

const inputClass =
  "w-full bg-void border border-gold-glow/20 rounded-sm px-4 py-3 text-sm text-ivory placeholder:text-ivory-faint/60 focus:outline-none focus:border-gold/50 transition-colors";

export default function CollectionFormModal({
  open,
  collection,
  onClose,
  onSaved,
  onError,
}: CollectionFormModalProps) {
  const t = useTranslations("Admin.Collections");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const formId = useId();
  const [form, setForm] = useState<CollectionFormInput>(emptyCollectionForm());
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (collection) {
      setForm({
        slug: collection.slug,
        nameEn: collection.nameEn,
        nameAr: collection.nameAr,
        sortOrder: collection.sortOrder,
        active: collection.active,
      });
      setSlugTouched(true);
      return;
    }

    void getNextCollectionSortOrder().then((sortOrder) => {
      setForm(emptyCollectionForm(sortOrder));
      setSlugTouched(false);
    });
  }, [open, collection]);

  function updateField<K extends keyof CollectionFormInput>(key: K, value: CollectionFormInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "nameEn" && !slugTouched) {
        next.slug = slugifyCollectionName(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const result = await upsertCollection({
      ...form,
      ...(collection ? { id: collection.id } : {}),
    });

    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved(result.collection);
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-void/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-title`}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-sm sm:rounded-sm border border-gold-glow/20 bg-obsidian shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {collection ? t("editCategory") : t("newCategory")}
                </p>
                <h2 id={`${formId}-title`} className="mt-2 font-serif text-2xl text-ivory">
                  {collection ? t("editCategoryTitle") : t("newCategoryTitle")}
                </h2>
                <p className="mt-1 text-sm text-ivory-muted">{t("formHint")}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${formId}-nameEn`} className="block text-[11px] uppercase tracking-wider text-ivory-faint">
                    {t("nameEn")}
                  </label>
                  <input
                    id={`${formId}-nameEn`}
                    value={form.nameEn}
                    onChange={(event) => updateField("nameEn", event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${formId}-nameAr`} className="block text-[11px] uppercase tracking-wider text-ivory-faint">
                    {t("nameAr")}
                  </label>
                  <input
                    id={`${formId}-nameAr`}
                    value={form.nameAr}
                    onChange={(event) => updateField("nameAr", event.target.value)}
                    className={inputClass}
                    required
                    dir="rtl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${formId}-slug`} className="block text-[11px] uppercase tracking-wider text-ivory-faint">
                    {t("slug")}
                  </label>
                  <input
                    id={`${formId}-slug`}
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      updateField("slug", slugifyCollectionName(event.target.value));
                    }}
                    className={inputClass}
                    required
                    dir="ltr"
                  />
                  <p className="text-[11px] text-ivory-faint/80">{t("slugHint")}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor={`${formId}-sort`} className="block text-[11px] uppercase tracking-wider text-ivory-faint">
                      {t("sortOrder")}
                    </label>
                    <input
                      id={`${formId}-sort`}
                      type="number"
                      min={0}
                      max={999}
                      value={form.sortOrder}
                      onChange={(event) => updateField("sortOrder", Number(event.target.value))}
                      className={inputClass}
                    />
                  </div>

                  <label className="flex items-end gap-3 pb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) => updateField("active", event.target.checked)}
                      className="accent-gold h-4 w-4"
                    />
                    <span className="text-sm text-ivory">{t("activeLabel")}</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
