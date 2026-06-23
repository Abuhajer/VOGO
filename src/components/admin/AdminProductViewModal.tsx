"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import type { AdminProduct } from "@/server/admin-actions";
import { localizeCollectionName } from "@/lib/collections";
import {
  formatMeasurementRange,
  parseProductSizeChart,
} from "@/lib/product-sizes";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { formatNumber } from "@/lib/format";
import Button from "@/components/ui/Button";

type AdminProductViewModalProps = {
  open: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onEdit: (product: AdminProduct) => void;
};

export default function AdminProductViewModal({
  open,
  product,
  onClose,
  onEdit,
}: AdminProductViewModalProps) {
  const t = useTranslations("Admin.Products");
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (!product) return null;

  const name = isArabic ? product.nameAr : product.nameEn;
  const description = isArabic ? product.descAr : product.descEn;
  const sizeChart = parseProductSizeChart(product.sizeChartJson);

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
            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-void">
              <Image
                src={product.imageSrc}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">
                  {product.collection
                    ? localizeCollectionName(product.collection, locale)
                    : t("noCollection")}
                </p>
                <h2 className="font-serif text-3xl text-ivory">{name}</h2>
                <p className="mt-2 text-gold text-xl font-serif">
                  {formatNumber(product.price, locale)} {isArabic ? "د.أ" : "JOD"}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <AdminStatusBadge
                  variant={product.active ? "active" : "inactive"}
                  label={product.active ? t("active") : t("inactive")}
                />
                {product.featuredCarousel ? (
                  <span className="inline-flex px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
                    {t("featuredCarousel")}
                  </span>
                ) : null}
                {product.customSizeEnabled ? (
                  <span className="inline-flex px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider bg-ivory-faint/10 text-ivory border border-gold-glow/15">
                    {t("customSizeEnabled")}
                  </span>
                ) : null}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("sku")}</p>
                  <p className="text-ivory mt-1" dir="ltr">
                    {product.sku}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ivory-faint">{t("slug")}</p>
                  <p className="text-ivory mt-1 break-all" dir="ltr">
                    {product.slug}
                  </p>
                </div>
              </div>

              <p className="text-sm text-ivory-muted leading-relaxed">{description}</p>

              {sizeChart ? (
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                    {t("viewSizeChart")}
                  </h3>
                  <div className="overflow-x-auto rounded-sm border border-gold-glow/15">
                    <table className="min-w-full text-xs">
                      <thead className="bg-void/80 text-[10px] uppercase tracking-wider text-ivory-faint">
                        <tr>
                          <th className="px-3 py-2 text-start font-normal">{t("sizeCode")}</th>
                          <th className="px-3 py-2 text-start font-normal">{t("chest")}</th>
                          <th className="px-3 py-2 text-start font-normal">{t("waist")}</th>
                          <th className="px-3 py-2 text-start font-normal">{t("height")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeChart.standardSizes.map((size) => (
                          <tr key={size.code} className="border-t border-gold-glow/10">
                            <td className="px-3 py-2 text-gold font-medium" dir="ltr">
                              {size.code}
                            </td>
                            <td className="px-3 py-2 text-ivory-muted" dir="ltr">
                              {formatMeasurementRange(size.chestCm, locale)}
                            </td>
                            <td className="px-3 py-2 text-ivory-muted" dir="ltr">
                              {formatMeasurementRange(size.waistCm, locale)}
                            </td>
                            <td className="px-3 py-2 text-ivory-muted" dir="ltr">
                              {formatMeasurementRange(size.heightCm, locale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ivory-faint">{t("noSizeChart")}</p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2 border-t border-gold-glow/10">
                <Link
                  href={`/shop/${product.slug}`}
                  className="inline-flex items-center justify-center px-6 py-3 text-xs border border-gold-glow/25 rounded-sm text-ivory-muted hover:text-gold"
                  target="_blank"
                >
                  {t("viewInShop")}
                </Link>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button type="button" variant="outline" onClick={onClose} isArabic={isArabic}>
                    {t("cancel")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit(product);
                    }}
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 bg-gold text-[#0E0D12] hover:shadow-[0_0_25px_rgba(201,168,76,0.3)]"
                  >
                    {t("edit")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
