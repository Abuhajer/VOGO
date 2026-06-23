"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import SectionLabel from "@/components/icons/SectionLabel";
import { CloseIcon, WhatsAppIcon } from "@/components/icons/Icons";
import PriceDisplay from "@/components/shop/PriceDisplay";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BUSINESS_PHONE_E164, formatNumber } from "@/lib/format";

type ProductDetailModalProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  imageSrc: string;
  slug?: string;
  nameAr?: string;
  nameEn?: string;
};

export default function ProductDetailModal({
  open,
  onClose,
  name,
  description,
  price,
  salePrice,
  imageSrc,
  slug,
  nameAr,
  nameEn,
}: ProductDetailModalProps) {
  const t = useTranslations("Collection");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const formattedPrice = formatNumber(salePrice != null && salePrice < price ? salePrice : price, locale);
  const isMobile = useIsMobile();
  const isMobileView = isMobile ?? true;
  const [mounted, setMounted] = useState(false);

  const canShop = Boolean(slug && nameAr && nameEn);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const whatsappMessage = t("inquireMessage", {
    product: name,
    price: formattedPrice,
  });
  const whatsappHref = `https://wa.me/${BUSINESS_PHONE_E164.replace("+", "")}?text=${encodeURIComponent(whatsappMessage)}`;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="product-detail-popup fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          aria-modal="true"
          role="dialog"
          aria-label={name}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-[#050508]/92 backdrop-blur-md sm:backdrop-blur-lg"
            onClick={onClose}
            aria-label={t("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            dir={isArabic ? "rtl" : "ltr"}
            className="product-detail-popup-panel relative z-10 w-full sm:max-w-4xl lg:max-w-5xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden bg-obsidian border border-gold-muted/30 rounded-t-xl sm:rounded-md shadow-[0_48px_120px_rgba(0,0,0,0.7)] safe-area-bottom"
            initial={
              isMobileView
                ? { opacity: 0, y: "100%" }
                : { opacity: 0, y: 48, scale: 0.92, rotateX: 8 }
            }
            animate={
              isMobileView
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: 0, scale: 1, rotateX: 0 }
            }
            exit={
              isMobileView
                ? { opacity: 0, y: "100%" }
                : { opacity: 0, y: 32, scale: 0.94, rotateX: 6 }
            }
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={isMobileView ? undefined : { transformPerspective: 1200 }}
          >
            <div className="sm:hidden mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-gold-muted/40" aria-hidden />

            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent z-20 pointer-events-none" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 end-3 sm:top-4 sm:end-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-gold-muted/40 bg-void/80 backdrop-blur-md text-ivory-muted hover:text-gold hover:border-gold transition-all duration-300"
              aria-label={t("close")}
            >
              <CloseIcon size={20} />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="relative h-[32dvh] min-h-[200px] max-h-[320px] sm:h-[38vh] sm:max-h-none lg:h-auto lg:min-h-[480px] bg-void shrink-0">
                <Image
                  src={imageSrc}
                  alt={name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top lg:object-center"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-obsidian/95" />
              </div>

              <div className="flex flex-col p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="pe-11 sm:pe-12">
                  <SectionLabel className="mb-2 sm:mb-3 text-gold-muted">{t("modalLabel")}</SectionLabel>
                  <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-ivory font-light leading-tight text-balance">
                    {name}
                  </h3>
                  <div className="mt-2 sm:mt-3">
                    <PriceDisplay
                      price={price}
                      salePrice={salePrice}
                      locale={locale}
                      size="md"
                      surface="default"
                    />
                  </div>
                  <div className="w-14 sm:w-16 h-px bg-gradient-to-r from-gold/80 to-transparent mt-4 sm:mt-5 mb-4 sm:mb-6" />
                </div>

                <p className="text-sm sm:text-base text-ivory-muted leading-relaxed font-sans font-light text-balance">
                  {description}
                </p>

                <ul className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {[t("modalFeature1"), t("modalFeature2"), t("modalFeature3")].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-xs sm:text-sm text-ivory-muted font-sans font-light"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 sm:mt-8 lg:mt-auto lg:pt-8 flex flex-col gap-3 sticky bottom-0 bg-obsidian pt-3 sm:pt-0 sm:static">
                  {canShop ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link
                        href={`/shop/${slug}`}
                        onClick={onClose}
                        className={`inline-flex w-full items-center justify-center min-h-[48px] px-5 py-3.5 bg-gold text-[#0E0D12] font-sans text-xs sm:text-sm font-semibold rounded-sm transition-all duration-300 hover:bg-gold-muted active:scale-[0.98] ${
                          isArabic ? "" : "uppercase tracking-[0.12em]"
                        }`}
                      >
                        {t("selectSizeInShop")}
                      </Link>
                      <Link
                        href={`/fitting-room?product=${slug}`}
                        onClick={onClose}
                        className={`inline-flex w-full items-center justify-center min-h-[48px] px-5 py-3.5 border border-gold/40 text-gold font-sans text-xs sm:text-sm font-semibold rounded-sm transition-all duration-300 hover:bg-gold/10 active:scale-[0.98] ${
                          isArabic ? "" : "uppercase tracking-[0.12em]"
                        }`}
                      >
                        {t("tryOn")}
                      </Link>
                    </div>
                  ) : null}

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex w-full items-center justify-center gap-2.5 min-h-[48px] px-5 sm:px-6 py-3.5 sm:py-4 bg-gold text-[#0E0D12] hover:bg-gold-muted font-sans text-xs sm:text-sm font-semibold rounded-sm transition-all duration-300 active:scale-[0.98] ${
                      isArabic ? "" : "uppercase tracking-[0.12em]"
                    }`}
                  >
                    <WhatsAppIcon size={18} className="shrink-0" />
                    {t("inquire")}
                  </a>

                  <button
                    type="button"
                    onClick={onClose}
                    className={`inline-flex w-full items-center justify-center min-h-[48px] px-5 sm:px-6 py-3.5 sm:py-4 border border-gold-muted/40 text-gold font-sans text-xs font-medium rounded-sm transition-all duration-300 hover:bg-gold/10 active:scale-[0.98] ${
                      isArabic ? "" : "uppercase tracking-[0.12em]"
                    }`}
                  >
                    {t("close")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
