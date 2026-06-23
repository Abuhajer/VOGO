"use client";

import { useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AdminPromotion,
  type PromotionFormInput,
  upsertPromotion,
} from "@/server/promotions";
import { DiscountType, PromotionScope } from "@/types/promotions";
import { formatDiscountLabel } from "@/lib/pricing";
import { fromIsoToDateTimeLocal } from "@/lib/datetime-local";
import { localizeCollectionName } from "@/lib/collections";
import Button from "@/components/ui/Button";
import DateTimePicker from "@/components/form/DateTimePicker";

type Props = {
  open: boolean;
  promotion: AdminPromotion | null;
  collections: { id: string; nameAr: string; nameEn: string }[];
  products: { id: string; nameAr: string; nameEn: string; collectionId: string | null }[];
  onClose: () => void;
  onSaved: (promotion: AdminPromotion) => void;
  onError: (key: string) => void;
};

const inputClass =
  "w-full bg-void border border-gold-glow/20 rounded-sm px-4 py-3 text-sm text-ivory focus:outline-none focus:border-gold/50";

function emptyForm(): PromotionFormInput {
  return {
    nameEn: "",
    nameAr: "",
    code: null,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    scope: PromotionScope.ORDER,
    collectionId: null,
    productIds: [],
    startsAt: null,
    endsAt: null,
    active: true,
    usageLimit: null,
    minSubtotal: null,
    badgeEn: null,
    badgeAr: null,
  };
}

export default function PromotionFormModal({
  open,
  promotion,
  collections,
  products,
  onClose,
  onSaved,
  onError,
}: Props) {
  const t = useTranslations("Admin.Promotions");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const formId = useId();
  const [form, setForm] = useState<PromotionFormInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const isCodeMode = Boolean(form.code?.trim());

  useEffect(() => {
    if (!open) return;
    if (promotion) {
      setForm({
        nameEn: promotion.nameEn,
        nameAr: promotion.nameAr,
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        scope: promotion.scope,
        collectionId: promotion.collectionId,
        productIds: promotion.productIds,
        startsAt: fromIsoToDateTimeLocal(promotion.startsAt as string | null),
        endsAt: fromIsoToDateTimeLocal(promotion.endsAt as string | null),
        active: promotion.active,
        usageLimit: promotion.usageLimit,
        minSubtotal: promotion.minSubtotal,
        badgeEn: promotion.badgeEn,
        badgeAr: promotion.badgeAr,
      });
      return;
    }
    setForm(emptyForm());
  }, [open, promotion]);

  function updateField<K extends keyof PromotionFormInput>(key: K, value: PromotionFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(preset: "code" | "collection" | "product") {
    if (preset === "code") {
      setForm({
        ...emptyForm(),
        nameEn: "Order promo",
        nameAr: "خصم على الطلب",
        code: "VOGO10",
        discountType: DiscountType.PERCENT,
        discountValue: 10,
        scope: PromotionScope.ORDER,
      });
      return;
    }
    if (preset === "collection" && collections[0]) {
      setForm({
        ...emptyForm(),
        nameEn: "Collection sale",
        nameAr: "تخفيض على المجموعة",
        code: null,
        discountType: DiscountType.PERCENT,
        discountValue: 15,
        scope: PromotionScope.COLLECTION,
        collectionId: collections[0].id,
        badgeEn: "15% OFF",
        badgeAr: "خصم 15%",
      });
      return;
    }
    if (products[0]) {
      setForm({
        ...emptyForm(),
        nameEn: "Spotlight pieces",
        nameAr: "قطع مميزة",
        code: null,
        discountType: DiscountType.PERCENT,
        discountValue: 20,
        scope: PromotionScope.PRODUCT,
        productIds: [products[0].id],
        badgeEn: "20% OFF",
        badgeAr: "خصم 20%",
      });
    }
  }

  function toggleProduct(productId: string) {
    setForm((current) => {
      const exists = current.productIds.includes(productId);
      return {
        ...current,
        productIds: exists
          ? current.productIds.filter((id) => id !== productId)
          : [...current.productIds, productId],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const result = await upsertPromotion({
      ...form,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      ...(promotion ? { id: promotion.id } : {}),
    });

    setSaving(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved(result.promotion);
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
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-sm sm:rounded-sm border border-gold-glow/20 bg-obsidian shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {promotion ? t("editCampaign") : t("newCampaign")}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-ivory">
                  {promotion ? t("editCampaignTitle") : t("newCampaignTitle")}
                </h2>
                <p className="mt-1 text-sm text-ivory-muted">{t("formHint")}</p>
              </div>

              {!promotion ? (
                <div className="grid sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("code")}
                    className="rounded-sm border border-gold-glow/15 bg-void/50 px-3 py-3 text-start hover:border-gold/30"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-gold">{t("presetCode")}</p>
                    <p className="mt-1 text-xs text-ivory-muted">{t("presetCodeHint")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("collection")}
                    className="rounded-sm border border-gold-glow/15 bg-void/50 px-3 py-3 text-start hover:border-gold/30"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-gold">{t("presetCollection")}</p>
                    <p className="mt-1 text-xs text-ivory-muted">{t("presetCollectionHint")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("product")}
                    className="rounded-sm border border-gold-glow/15 bg-void/50 px-3 py-3 text-start hover:border-gold/30"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-gold">{t("presetProduct")}</p>
                    <p className="mt-1 text-xs text-ivory-muted">{t("presetProductHint")}</p>
                  </button>
                </div>
              ) : null}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("nameEn")}</label>
                  <input
                    value={form.nameEn}
                    onChange={(event) => updateField("nameEn", event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("nameAr")}</label>
                  <input
                    value={form.nameAr}
                    onChange={(event) => updateField("nameAr", event.target.value)}
                    className={inputClass}
                    required
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="rounded-sm border border-gold-glow/15 bg-void/40 p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("code", null)}
                    className={`px-3 py-2 rounded-sm text-[11px] uppercase tracking-wider border ${
                      !isCodeMode ? "border-gold/40 bg-gold/10 text-gold" : "border-gold-glow/15 text-ivory-muted"
                    }`}
                  >
                    {t("modeSale")}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("code", form.code ?? "VOGO10")}
                    className={`px-3 py-2 rounded-sm text-[11px] uppercase tracking-wider border ${
                      isCodeMode ? "border-gold/40 bg-gold/10 text-gold" : "border-gold-glow/15 text-ivory-muted"
                    }`}
                  >
                    {t("modeCode")}
                  </button>
                </div>

                {isCodeMode ? (
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("code")}</label>
                    <input
                      value={form.code ?? ""}
                      onChange={(event) => updateField("code", event.target.value.toUpperCase())}
                      className={`${inputClass} uppercase`}
                      dir="ltr"
                      required
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("discountType")}</label>
                  <select
                    value={form.discountType}
                    onChange={(event) => updateField("discountType", event.target.value as PromotionFormInput["discountType"])}
                    className={inputClass}
                  >
                    <option value={DiscountType.PERCENT}>{t("percent")}</option>
                    <option value={DiscountType.FIXED}>{t("fixed")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("discountValue")}</label>
                  <input
                    type="number"
                    min={1}
                    max={form.discountType === DiscountType.PERCENT ? 100 : 99999}
                    value={form.discountValue}
                    onChange={(event) => updateField("discountValue", Number(event.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("scope")}</label>
                  <select
                    value={form.scope}
                    onChange={(event) => updateField("scope", event.target.value as PromotionFormInput["scope"])}
                    className={inputClass}
                  >
                    <option value={PromotionScope.ORDER}>{t("scopeOrder")}</option>
                    <option value={PromotionScope.COLLECTION}>{t("scopeCollection")}</option>
                    <option value={PromotionScope.PRODUCT}>{t("scopeProduct")}</option>
                  </select>
                </div>
              </div>

              {form.scope === PromotionScope.COLLECTION ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("collection")}</label>
                  <select
                    value={form.collectionId ?? ""}
                    onChange={(event) => updateField("collectionId", event.target.value || null)}
                    className={inputClass}
                    required
                  >
                    <option value="">{t("chooseCollection")}</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {localizeCollectionName(collection, locale)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {form.scope === PromotionScope.PRODUCT ? (
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("products")}</label>
                  <div className="max-h-44 overflow-y-auto rounded-sm border border-gold-glow/15 divide-y divide-gold-glow/10">
                    {products.map((product) => {
                      const checked = form.productIds.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-void/40"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduct(product.id)}
                            className="accent-gold"
                          />
                          <span className="text-ivory">{isArabic ? product.nameAr : product.nameEn}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint" htmlFor={`${formId}-starts`}>
                    {t("startsAt")}
                  </label>
                  <DateTimePicker
                    id={`${formId}-starts`}
                    value={form.startsAt ?? null}
                    onChange={(value) => updateField("startsAt", value)}
                    locale={locale}
                    placeholder={t("datePickerPlaceholder")}
                    clearLabel={t("datePickerClear")}
                    timeLabel={t("datePickerTime")}
                    todayLabel={t("datePickerToday")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-ivory-faint" htmlFor={`${formId}-ends`}>
                    {t("endsAt")}
                  </label>
                  <DateTimePicker
                    id={`${formId}-ends`}
                    value={form.endsAt ?? null}
                    onChange={(value) => updateField("endsAt", value)}
                    locale={locale}
                    placeholder={t("datePickerPlaceholder")}
                    clearLabel={t("datePickerClear")}
                    timeLabel={t("datePickerTime")}
                    todayLabel={t("datePickerToday")}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {isCodeMode ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("usageLimit")}</label>
                      <input
                        type="number"
                        min={1}
                        value={form.usageLimit ?? ""}
                        onChange={(event) =>
                          updateField("usageLimit", event.target.value ? Number(event.target.value) : null)
                        }
                        className={inputClass}
                        placeholder={t("unlimited")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("minSubtotal")}</label>
                      <input
                        type="number"
                        min={1}
                        value={form.minSubtotal ?? ""}
                        onChange={(event) =>
                          updateField("minSubtotal", event.target.value ? Number(event.target.value) : null)
                        }
                        className={inputClass}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("badgeEn")}</label>
                      <input
                        value={form.badgeEn ?? ""}
                        onChange={(event) => updateField("badgeEn", event.target.value || null)}
                        className={inputClass}
                        placeholder={formatDiscountLabel(form.discountType, form.discountValue, "en")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-ivory-faint">{t("badgeAr")}</label>
                      <input
                        value={form.badgeAr ?? ""}
                        onChange={(event) => updateField("badgeAr", event.target.value || null)}
                        className={inputClass}
                        dir="rtl"
                        placeholder={formatDiscountLabel(form.discountType, form.discountValue, "ar")}
                      />
                    </div>
                  </>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => updateField("active", event.target.checked)}
                  className="accent-gold h-4 w-4"
                />
                <span className="text-sm text-ivory">{t("activeLabel")}</span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
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
