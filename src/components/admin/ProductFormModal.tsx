"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AdminProduct,
  type ProductFormInput,
  getNextProductSku,
  upsertProduct,
} from "@/server/admin-actions";
import {
  emptyProductForm,
  PRODUCT_IMAGE_PRESETS,
  productToFormInput,
  slugifyProductName,
} from "@/lib/admin-products";
import {
  defaultProductSizeChart,
  parseProductSizeChart,
  serializeProductSizeChart,
  type ProductSizeChart,
  type StandardSize,
} from "@/lib/product-sizes";
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

type TabKey = "details" | "media" | "sizing" | "publish";

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

const readOnlyClass =
  "w-full bg-void/60 border border-gold-glow/10 rounded-sm px-4 py-3 text-sm text-ivory-muted cursor-default";

function SizeChartEditor({
  chart,
  onChange,
  t,
}: {
  chart: ProductSizeChart;
  onChange: (chart: ProductSizeChart) => void;
  t: ReturnType<typeof useTranslations<"Admin.Products">>;
}) {
  function updateSize(index: number, patch: Partial<StandardSize>) {
    const next = chart.standardSizes.map((size, i) =>
      i === index ? { ...size, ...patch } : size
    );
    onChange({ standardSizes: next });
  }

  function updateRange(
    index: number,
    field: keyof Pick<
      StandardSize,
      "chestCm" | "waistCm" | "jacketLengthCm" | "sleeveCm" | "shoulderCm" | "heightCm"
    >,
    bound: "min" | "max",
    raw: string
  ) {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    const size = chart.standardSizes[index];
    updateSize(index, { [field]: { ...size[field], [bound]: value } });
  }

  function addSizeRow() {
    const numericCodes = chart.standardSizes
      .map((size) => parseInt(size.code, 10))
      .filter((code) => Number.isFinite(code));
    const nextCode = String((numericCodes.length ? Math.max(...numericCodes) : 44) + 2);
    const template = chart.standardSizes[chart.standardSizes.length - 1];
    if (!template) return;
    onChange({
      standardSizes: [
        ...chart.standardSizes,
        {
          ...template,
          code: nextCode,
          labelEn: `EU ${nextCode}`,
          labelAr: `مقاس ${nextCode}`,
        },
      ],
    });
  }

  function removeSizeRow(index: number) {
    if (chart.standardSizes.length <= 1) return;
    onChange({ standardSizes: chart.standardSizes.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
    <div className="overflow-x-auto rounded-sm border border-gold-glow/15">
      <table className="min-w-full text-xs">
        <thead className="bg-void/80 text-[10px] uppercase tracking-wider text-ivory-faint">
          <tr>
            <th className="px-3 py-2 text-start font-normal">{t("sizeCode")}</th>
            <th className="px-3 py-2 text-start font-normal">{t("chest")}</th>
            <th className="px-3 py-2 text-start font-normal">{t("waist")}</th>
            <th className="px-3 py-2 text-start font-normal">{t("jacketLength")}</th>
            <th className="px-3 py-2 text-start font-normal">{t("sleeve")}</th>
            <th className="px-3 py-2 text-start font-normal">{t("shoulder")}</th>
            <th className="px-3 py-2 text-start font-normal">{t("height")}</th>
            <th className="px-3 py-2 text-end font-normal w-16" />
          </tr>
        </thead>
        <tbody>
          {chart.standardSizes.map((size, index) => (
            <tr key={`${size.code}-${index}`} className="border-t border-gold-glow/10">
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={size.code}
                  onChange={(e) => updateSize(index, { code: e.target.value.trim() })}
                  className="w-12 bg-void border border-gold-glow/15 rounded-sm px-1 py-1 text-center font-medium text-gold"
                  dir="ltr"
                />
              </td>
              {(
                [
                  "chestCm",
                  "waistCm",
                  "jacketLengthCm",
                  "sleeveCm",
                  "shoulderCm",
                  "heightCm",
                ] as const
              ).map((field) => (
                <td key={field} className="px-3 py-2">
                  <div className="flex items-center gap-1" dir="ltr">
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={size[field].min}
                      onChange={(e) => updateRange(index, field, "min", e.target.value)}
                      className="w-12 bg-void border border-gold-glow/15 rounded-sm px-1 py-1 text-center"
                    />
                    <span className="text-ivory-faint">–</span>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={size[field].max}
                      onChange={(e) => updateRange(index, field, "max", e.target.value)}
                      className="w-12 bg-void border border-gold-glow/15 rounded-sm px-1 py-1 text-center"
                    />
                  </div>
                </td>
              ))}
              <td className="px-3 py-2 text-end">
                <button
                  type="button"
                  onClick={() => removeSizeRow(index)}
                  disabled={chart.standardSizes.length <= 1}
                  className="text-[10px] uppercase tracking-wider text-ivory-faint hover:text-gold disabled:opacity-30"
                >
                  {t("removeSizeRow")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button
      type="button"
      onClick={addSizeRow}
      className="px-3 py-2 text-[10px] uppercase tracking-wider border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold"
    >
      {t("addSizeRow")}
    </button>
    </div>
  );
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductFormInput>(emptyProductForm);
  const [sizeChart, setSizeChart] = useState<ProductSizeChart>(defaultProductSizeChart());
  const [tab, setTab] = useState<TabKey>("details");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingSku, setLoadingSku] = useState(false);
  const isEdit = Boolean(product);

  useEffect(() => {
    if (!open) return;

    setTab("details");

    if (product) {
      setForm(productToFormInput(product));
      setSizeChart(
        parseProductSizeChart(product.sizeChartJson) ?? defaultProductSizeChart()
      );
      return;
    }

    setForm({
      ...emptyProductForm,
      collectionId: collections[0]?.id ?? null,
    });
    setSizeChart(defaultProductSizeChart());

    setLoadingSku(true);
    void getNextProductSku()
      .then((sku) => {
        setForm((current) => ({ ...current, sku }));
      })
      .finally(() => setLoadingSku(false));
  }, [open, product, collections]);

  useEffect(() => {
    if (!open || isEdit) return;
    setForm((current) => ({
      ...current,
      slug: slugifyProductName(current.nameEn),
    }));
  }, [open, isEdit, form.nameEn]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function updateField<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        onError("upload");
        return;
      }
      updateField("imageSrc", data.url);
    } catch {
      onError("upload");
    } finally {
      setUploading(false);
    }
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.price || form.price <= 0) {
      onError("validation");
      return;
    }

    setSaving(true);

    const payload: ProductFormInput & { id?: string } = {
      ...form,
      sizeChartJson: serializeProductSizeChart(sizeChart),
      id: product?.id,
    };

    const result = await upsertProduct(payload);
    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved(result.product);
    onClose();
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "details", label: t("sectionDetails") },
    { key: "media", label: t("sectionMedia") },
    { key: "sizing", label: t("sectionSizing") },
    { key: "publish", label: t("sectionPublish") },
  ];

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
            className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-obsidian border border-gold-glow/20 rounded-t-sm sm:rounded-sm shadow-2xl"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="sticky top-0 z-10 border-b border-gold-glow/10 bg-obsidian/95 backdrop-blur px-6 py-4">
              <div className="flex items-center justify-between gap-4">
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

              <div className="mt-4 flex flex-wrap gap-2">
                {tabs.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-sm border transition-colors ${
                      tab === item.key
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-gold-glow/15 text-ivory-muted hover:text-ivory"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {tab === "details" ? (
                <>
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
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          updateField("price", Number.isFinite(next) ? next : 0);
                        }}
                        className={inputClass}
                        dir="ltr"
                      />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field id={`${formId}-sku`} label={t("sku")} hint={t("skuAutoHint")}>
                      <div className="flex gap-2">
                        <input
                          id={`${formId}-sku`}
                          required
                          readOnly
                          value={loadingSku ? "…" : form.sku}
                          className={readOnlyClass}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => void copyToClipboard(form.sku)}
                          className="shrink-0 px-3 py-2 text-[10px] uppercase tracking-wider border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold"
                        >
                          {t("copy")}
                        </button>
                      </div>
                    </Field>
                    <Field id={`${formId}-slug`} label={t("slug")} hint={t("slugAutoHint")}>
                      <div className="flex gap-2">
                        <input
                          id={`${formId}-slug`}
                          required
                          readOnly
                          value={form.slug}
                          className={readOnlyClass}
                          dir="ltr"
                        />
                        {!isEdit ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateField("slug", slugifyProductName(form.nameEn))
                            }
                            className="shrink-0 px-3 py-2 text-[10px] uppercase tracking-wider border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold"
                          >
                            {t("regenerateSlug")}
                          </button>
                        ) : null}
                      </div>
                    </Field>
                  </div>
                </>
              ) : null}

              {tab === "media" ? (
                <>
                  <Field id={`${formId}-imageSrc`} label={t("imageSrc")} hint={t("imageHint")}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUpload(file);
                        event.target.value = "";
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-xs border border-gold-glow/25 rounded-sm text-ivory hover:text-gold disabled:opacity-50"
                      >
                        {uploading ? t("uploading") : t("uploadImage")}
                      </button>
                      <select
                        value={
                          PRODUCT_IMAGE_PRESETS.includes(
                            form.imageSrc as (typeof PRODUCT_IMAGE_PRESETS)[number]
                          )
                            ? form.imageSrc
                            : ""
                        }
                        onChange={(event) => {
                          if (event.target.value) updateField("imageSrc", event.target.value);
                        }}
                        className={`${inputClass} max-w-xs`}
                      >
                        <option value="">{t("presetPlaceholder")}</option>
                        {PRODUCT_IMAGE_PRESETS.map((src) => (
                          <option key={src} value={src}>
                            {src.split("/").pop()}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.imageSrc ? (
                      <p className="text-[11px] text-ivory-faint mt-2 break-all" dir="ltr">
                        {form.imageSrc}
                      </p>
                    ) : null}
                  </Field>

                  <div className="relative w-full max-w-xs aspect-[3/4] rounded-sm overflow-hidden border border-gold-glow/15 bg-void">
                    {form.imageSrc ? (
                      <Image
                        src={form.imageSrc}
                        alt={form.nameEn || t("preview")}
                        fill
                        sizes="320px"
                        className="object-cover"
                        unoptimized={form.imageSrc.startsWith("data:")}
                      />
                    ) : null}
                  </div>
                </>
              ) : null}

              {tab === "sizing" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-ivory-muted">{t("sizeChartHint")}</p>
                    <button
                      type="button"
                      onClick={() => setSizeChart(defaultProductSizeChart())}
                      className="px-3 py-2 text-[10px] uppercase tracking-wider border border-gold-glow/20 rounded-sm text-ivory-muted hover:text-gold"
                    >
                      {t("loadDefaults")}
                    </button>
                  </div>

                  <SizeChartEditor chart={sizeChart} onChange={setSizeChart} t={t} />

                  <label className="inline-flex items-center gap-3 text-sm text-ivory">
                    <input
                      type="checkbox"
                      checked={form.customSizeEnabled}
                      onChange={(event) =>
                        updateField("customSizeEnabled", event.target.checked)
                      }
                      className="h-4 w-4 accent-gold"
                    />
                    {t("customSizeEnabled")}
                  </label>
                </>
              ) : null}

              {tab === "publish" ? (
                <div className="space-y-5">
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
                      onChange={(event) =>
                        updateField("featuredCarousel", event.target.checked)
                      }
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
              ) : null}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gold-glow/10">
                <Button type="button" variant="outline" onClick={onClose} isArabic={isArabic}>
                  {t("cancel")}
                </Button>
                <button
                  type="submit"
                  disabled={saving || uploading || loadingSku}
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
