"use client";

import { useTranslations } from "next-intl";

type StepKey = "product" | "photo";

type Props = {
  step: StepKey;
  showCarouselHint?: boolean;
  variant?: "stacked" | "sidebar" | "overlay";
};

export default function FittingRoomStepIntro({
  step,
  showCarouselHint = false,
  variant = "stacked",
}: Props) {
  const t = useTranslations("FittingRoom");

  const label = step === "product" ? t("step1Label") : t("step2Label");
  const title = step === "product" ? t("step1Title") : t("step2Title");
  const desc = step === "product" ? t("step1Desc") : t("step2Desc");

  if (variant === "overlay") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-void/96 via-void/72 to-transparent px-3 pb-10 pt-2 sm:px-5 sm:pb-12 sm:pt-3 md:px-6"
        aria-hidden={false}
      >
        <p className="mb-0.5 text-[9px] uppercase tracking-[0.28em] text-gold sm:text-[10px]">{label}</p>
        <h2 className="font-serif text-lg leading-tight text-ivory sm:text-xl md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-xl text-[11px] leading-snug text-ivory-muted/90 line-clamp-2 sm:text-xs sm:leading-relaxed">
          {desc}
        </p>
        {step === "product" && showCarouselHint ? (
          <p className="mt-1 hidden text-[10px] text-ivory-faint sm:block">{t("carouselHint")}</p>
        ) : null}
        {step === "photo" ? (
          <p className="mt-1 hidden text-[10px] text-ivory-faint md:block">{t("portraitHint")}</p>
        ) : null}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-gold sm:text-[10px]">{label}</p>
        <h2 className="font-serif text-xl leading-tight text-ivory lg:text-[1.65rem] lg:leading-snug">
          {title}
        </h2>
        <p className="mt-2.5 text-[11px] leading-relaxed text-ivory-muted">{desc}</p>
        {step === "product" && showCarouselHint ? (
          <p className="mt-3 text-[10px] leading-relaxed text-ivory-faint">{t("carouselHint")}</p>
        ) : null}
        {step === "photo" ? (
          <p className="mt-3 text-[10px] leading-relaxed text-ivory-faint">{t("portraitHint")}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-2 shrink-0 border-b border-gold-glow/10 px-3 pb-2 pt-2 sm:mb-4 sm:border-0 sm:px-0 sm:pb-0 sm:pt-0 md:mb-5">
      <p className="mb-0.5 text-[9px] uppercase tracking-[0.28em] text-gold sm:mb-1 sm:text-[11px] sm:tracking-[0.3em]">
        {label}
      </p>
      <h2 className="font-serif text-base leading-tight text-ivory sm:text-2xl md:text-[1.75rem] lg:text-3xl">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-[10px] leading-snug text-ivory-muted line-clamp-2 sm:mt-1.5 sm:line-clamp-none sm:text-sm sm:leading-relaxed">
        {desc}
      </p>
      {step === "product" && showCarouselHint ? (
        <p className="mt-2 text-[10px] text-ivory-faint sm:text-[11px]">{t("carouselHint")}</p>
      ) : null}
    </div>
  );
}
