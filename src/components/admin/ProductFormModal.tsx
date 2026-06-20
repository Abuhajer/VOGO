"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AdminProduct,
  type ProductFormInput,
  upsertProduct,
} from "@/server/admin-actions";
import {
  emptyProductForm,
  PRODUCT_IMAGE_PRESETS,
  slugifyProductName,
} from "@/lib/admin-products";
import { formatNumber } from "@/lib/format";
import Button from "@/components/ui/Button";

type ProductFormModalProps = {
  open: boolean;
  product: AdminProduct | null;
  collections: { id: string; nameAr: string; nameEn: string }[];
  onClose: () => void;
  onSaved: (product: AdminProduct) => void;
  onError: (key: string) => void;
};

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] uppercase tracking-wider text-ivory-faint">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-ivory-faint/80">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full bg-void border border-gold-glow/20 rounded-sm px-4 py-3 text-sm text-ivory placeholder:text-ivory-faint/60 focus:outline-none focus:border-gold/50 transition-colors";

export default function ProductFormModal({
  open,
  product,
  collections,
  onClose,
  onSaved,
  onError,
}: ProductFormModalProps) {
  const t = useTranslations("Admin.Products");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const formId = useId();
  const [form, setForm] = useState<ProductFormInput>(emptyProductForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (product) {
      setForm({
        slug: product.slug,
        sku: product.sku,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        descAr: product.descAr,
        descEn: product.descEn,
        price: product.price,
        imageSrc: product.imageSrc,
        active: product.active,
        featuredCarousel: product.featuredCarousel,
        collectionId: product.collectionId,
      });
      setSlugEdited(true);
      return;
    }

    setForm({
      ...emptyProductForm,
      collectionId: collections[0]?.id ?? null,
    });
    setSlugEdited(false);
  }, [open, product, collections]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function updateField<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "nameEn" && !slugEdited && typeof value === "string") {
        next.slug = slugifyProductName(value);
      }

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.price || form.price <= 0) {
      onError("validation");
      return;
    }

    setSaving(true);

    const result = await upsertProduct({
      ...form,
      id: product?.id,
    });

    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved(result.product);
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${formId}-title`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#050508]/85 backdrop-blur-sm"
            onClick={onClose}
            aria-label={t("cancel")}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-obsidian border border-gold-glow/20 rounded-t-sm sm:rounded-sm shadow-2xl"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gold-glow/10 bg-obsidian/95 backdrop-blur px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
                  {product ? t("editProduct") : t("addProduct")}
                </p>
                <h2 id={`${formId}-title`} className="font-serif text-2xl text-ivory mt-1">
                  {product ? product.nameEn : t("newProductTitle")}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-ivory-faint hover:text-gold text-sm px-3 py-2"
              >
                {t("cancel")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field id={`${formId}-nameEn`} label={t("nameEn")}>
                  <input
                    id={`${formId}-nameEn`}
                    required
                    value={form.nameEn}
                    onChange={(event) => updateField("nameEn", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field id={`${formId}-nameAr`} label={t("nameAr")}>
                  <input
                    id={`${formId}-nameAr`}
                    required
                    value={form.nameAr}
                    onChange={(event) => updateField("nameAr", event.target.value)}
                    className={inputClass}
                    dir="rtl"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field id={`${formId}-descEn`} label={t("descEn")}>
                  <textarea
                    id={`${formId}-descEn`}
                    required
                    rows={4}
                    value={form.descEn}
                    onChange={(event) => updateField("descEn", event.target.value)}
                    className={`${inputClass} resize-y min-h-[112px]`}
                  />
                </Field>
                <Field id={`${formId}-descAr`} label={t("descAr")}>
                  <textarea
                    id={`${formId}-descAr`}
                    required
                    rows={4}
                    value={form.descAr}
                    onChange={(event) => updateField("descAr", event.target.value)}
                    className={`${inputClass} resize-y min-h-[112px]`}
                    dir="rtl"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field id={`${formId}-collection`} label={t("collection")}>
                  <select
                    id={`${formId}-collection`}
                    value={form.collectionId ?? ""}
                    onChange={(event) =>
                      updateField("collectionId", event.target.value || null)
                    }
                    className={inputClass}
                  >
                    <option value="">{t("noCollection")}</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {isArabic ? collection.nameAr : collection.nameEn}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`${formId}-price`} label={t("price")}>
                  <input
                    id={`${formId}-price`}
                    required
                    type="number"
                    min={1}
                    value={form.price || ""}
                    onChange={(event) => updateField("price", Number(event.target.value))}
                    className={inputClass}
                    dir="ltr"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                <Field id={`${formId}-sku`} label={t("sku")}>
                  <input
                    id={`${formId}-sku`}
                    required
                    value={form.sku}
                    onChange={(event) => updateField("sku", event.target.value.toUpperCase())}
                    className={inputClass}
                  />
                </Field>
                <Field id={`${formId}-slug`} label={t("slug")}>
                  <input
                    id={`${formId}-slug`}
                    required
                    value={form.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      updateField("slug", slugifyProductName(event.target.value));
                    }}
                    className={inputClass}
                    dir="ltr"
                  />
                </Field>
              </div>

              <Field id={`${formId}-imageSrc`} label={t("imageSrc")} hint={t("imageHint")}>
                <select
                  id={`${formId}-imageSrc`}
                  value={form.imageSrc}
                  onChange={(event) => updateField("imageSrc", event.target.value)}
                  className={inputClass}
                >
                  {PRODUCT_IMAGE_PRESETS.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
                <input
                  value={form.imageSrc}
                  onChange={(event) => updateField("imageSrc", event.target.value)}
                  className={`${inputClass} mt-2`}
                  dir="ltr"
                  placeholder="/images/products/your-image.png"
                />
              </Field>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative w-full sm:w-40 aspect-[3/4] rounded-sm overflow-hidden border border-gold-glow/15 bg-void shrink-0">
                  {form.imageSrc ? (
                    <Image
                      src={form.imageSrc}
                      alt={form.nameEn || t("preview")}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <label className="inline-flex items-center gap-3 text-sm text-ivory">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) => updateField("active", event.target.checked)}
                      className="h-4 w-4 accent-gold"
                    />
                    {t("activeLabel")}
                  </label>
                  <label className="inline-flex items-center gap-3 text-sm text-ivory">
                    <input
                      type="checkbox"
                      checked={form.featuredCarousel}
                      onChange={(event) => updateField("featuredCarousel", event.target.checked)}
                      className="h-4 w-4 accent-gold"
                    />
                    {t("featuredCarousel")}
                  </label>
                  <p className="text-sm text-ivory-muted">
                    {form.price > 0
                      ? `${formatNumber(form.price, locale)} ${isArabic ? "د.أ" : "JOD"}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gold-glow/10">
                <Button type="button" variant="outline" onClick={onClose} isArabic={isArabic}>
                  {t("cancel")}
                </Button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 bg-gold text-[#0E0D12] hover:shadow-[0_0_25px_rgba(201,168,76,0.3)] disabled:opacity-60"
                >
                  {saving ? t("saving") : t("saveProduct")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
