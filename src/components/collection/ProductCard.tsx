"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber } from "@/lib/format";

type ProductCardProps = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageSrc: string;
  index: number;
  carousel3d?: boolean;
  onOpenDetails: () => void;
};

export default function ProductCard({
  name,
  description,
  price,
  imageSrc,
  index,
  carousel3d = false,
  onOpenDetails,
}: ProductCardProps) {
  const t = useTranslations("Collection");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const formattedPrice = formatNumber(price, locale);

  return (
    <div
      className="product-card-inner h-full"
      style={carousel3d ? { transformStyle: "preserve-3d" } : undefined}
    >
      <article
        dir={isArabic ? "rtl" : "ltr"}
        className={`product-card h-full flex flex-col bg-obsidian border border-gold-muted/20 light:border-gold-muted/30 rounded-sm overflow-hidden transition-[border-color,box-shadow] duration-500 ${
          carousel3d
            ? "product-card-carousel w-[80vw] max-w-[300px] sm:max-w-[300px] md:w-[340px] md:max-w-none cursor-pointer"
            : "group w-full light:shadow-[0_8px_32px_rgba(14,13,18,0.08)] p-4 hover:border-gold-muted/50 hover:-translate-y-1"
        } ${carousel3d ? "p-0" : ""}`}
        style={carousel3d ? { backfaceVisibility: "hidden" } : undefined}
      >
        <button
          type="button"
          onClick={onOpenDetails}
          className={`relative w-full overflow-hidden bg-void text-start cursor-pointer ${
            carousel3d ? "aspect-[3/4] carousel-image" : "aspect-[4/5] rounded-sm"
          }`}
          aria-label={t("view")}
        >
          <Image
            src={imageSrc}
            alt={name}
            fill
            quality={index < 2 ? 85 : 78}
            sizes={
              carousel3d
                ? "(max-width: 640px) 78vw, (max-width: 768px) 290px, 320px"
                : "(max-width: 640px) 100vw, 400px"
            }
            priority={index < 2}
            loading={index < 3 ? "eager" : "lazy"}
            fetchPriority={index < 2 ? "high" : "low"}
            className={`object-contain object-center ${
              carousel3d ? "carousel-product-image" : "transition-transform duration-700 ease-fabric group-hover:scale-105"
            }`}
          />
          <div
            className={`absolute inset-0 z-10 transition-opacity duration-500 ${
              carousel3d
                ? "bg-gradient-to-t from-[#050508]/85 via-[#050508]/25 to-transparent opacity-70 group-[.is-active]:opacity-90"
                : "bg-gradient-to-t from-[#050508]/75 via-[#050508]/10 to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-60"
            }`}
          />

          {carousel3d ? (
            <motion.div
              className="absolute bottom-0 inset-x-0 z-20 p-3.5 sm:p-4 flex flex-col gap-1"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="font-serif text-sm sm:text-base md:text-lg text-ivory leading-snug line-clamp-2 group-[.is-active]:text-gold transition-colors duration-500">
                {name}
              </h3>
              <span className="font-sans text-[11px] sm:text-xs md:text-sm text-gold">
                {formattedPrice} {t("currency")}
              </span>
              <span
                className={`mt-2 inline-flex self-start items-center min-h-[44px] px-3.5 py-2 rounded-sm border border-gold/40 text-gold text-[10px] sm:text-[11px] font-semibold bg-void/50 backdrop-blur-sm group-[.is-active]:bg-gold group-[.is-active]:text-[#0E0D12] group-[.is-active]:border-gold transition-all duration-500 ${
                  isArabic ? "" : "uppercase tracking-[0.12em]"
                }`}
              >
                {t("view")}
              </span>
            </motion.div>
          ) : (
            <div className="absolute bottom-4 left-4 right-4 z-20 md:translate-y-6 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-fabric flex justify-center">
              <span
                className={`px-5 py-2.5 bg-gold text-[#0E0D12] font-sans text-[10px] font-semibold rounded-sm shadow-lg ${
                  isArabic ? "" : "uppercase tracking-[0.2em]"
                }`}
              >
                {t("view")}
              </span>
            </div>
          )}
        </button>

        {!carousel3d && (
          <div className="mt-4 flex flex-col flex-grow px-0">
            <div className="flex justify-between items-start gap-3">
              <h3 className="font-serif text-lg md:text-xl text-ivory leading-snug group-hover:text-gold transition-colors duration-300">
                {name}
              </h3>
              <span className="font-sans text-sm md:text-base text-gold whitespace-nowrap pt-0.5">
                {formattedPrice} {t("currency")}
              </span>
            </div>

            <p className="mt-2 text-xs md:text-sm text-ivory-muted leading-relaxed font-sans font-light flex-grow">
              {description}
            </p>

            <button
              type="button"
              onClick={onOpenDetails}
              className={`mt-4 w-full py-2.5 bg-gold text-[#0E0D12] font-sans text-[11px] font-semibold rounded-sm transition-all duration-300 hover:bg-gold-muted hover:shadow-[0_4px_15px_rgba(179,142,54,0.25)] ${
                isArabic ? "" : "uppercase tracking-[0.15em]"
              }`}
            >
              {t("view")}
            </button>

            <div className="w-full h-px bg-gold-glow/10 mt-4 group-hover:bg-gold-muted/30 transition-colors duration-500" />
          </div>
        )}
      </article>
    </div>
  );
}
