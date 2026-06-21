"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { PrimeMarkIcon } from "@/components/icons/Icons";

type Props = {
  onRetry?: () => void;
};

export default function FittingRoomErrorFallback({ onRetry }: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center"
      dir={isAr ? "rtl" : "ltr"}
    >
      <PrimeMarkIcon size={28} className="mb-4 text-gold" />
      <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-gold">{t("eyebrow")}</p>
      <h1 className="mb-2 font-serif text-xl text-ivory sm:text-2xl">{t("loadErrorTitle")}</h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-ivory-muted">{t("loadErrorDesc")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-sm border border-gold/40 bg-surface/80 px-6 py-2.5 text-[11px] font-semibold text-gold transition-colors hover:border-gold/60 hover:bg-surface"
          >
            {t("loadErrorRetry")}
          </button>
        ) : null}
        <Link
          href="/"
          className="min-h-11 rounded-sm bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#0E0D12] transition-opacity hover:opacity-90"
        >
          {t("loadErrorHome")}
        </Link>
      </div>
    </div>
  );
}
