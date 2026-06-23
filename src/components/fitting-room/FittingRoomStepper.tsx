"use client";

import { useLocale, useTranslations } from "next-intl";

export type FittingRoomStepKey = "product" | "photo" | "processing" | "result";

const STEPS: { key: FittingRoomStepKey; num: number }[] = [
  { key: "product", num: 1 },
  { key: "photo", num: 2 },
  { key: "processing", num: 3 },
  { key: "result", num: 4 },
];

type Props = {
  current: FittingRoomStepKey;
  compact?: boolean;
  reachableSteps?: FittingRoomStepKey[];
  onStepClick?: (step: FittingRoomStepKey) => void;
  className?: string;
};

export default function FittingRoomStepper({
  current,
  compact,
  reachableSteps = [],
  onStepClick,
  className = "",
}: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";

  const currentIndex = STEPS.findIndex((s) => s.key === current);

  const labels: Record<FittingRoomStepKey, string> = {
    product: t("stepProduct"),
    photo: t("stepPhoto"),
    processing: t("stepProcessing"),
    result: t("stepResult"),
  };

  return (
    <nav
      aria-label={t("stepperLabel")}
      className={compact ? `w-full sm:w-auto ${className}`.trim() : `w-full ${className}`.trim()}
      dir={isAr ? "rtl" : "ltr"}
    >
      <ol
        className={`flex items-center ${
          compact ? "justify-between gap-0 sm:justify-end sm:gap-1 md:gap-1.5" : "justify-between gap-1"
        }`}
      >
        {STEPS.map((step, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          const isProcessing = step.key === "processing";
          const canClick =
            Boolean(onStepClick) &&
            !active &&
            !isProcessing &&
            reachableSteps.includes(step.key);

          const badgeClass = `flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold transition-colors duration-200 sm:h-8 sm:w-8 sm:text-[10px] ${
            active
              ? "border-gold bg-gold/20 text-gold"
              : done
                ? "border-gold/50 bg-gold/10 text-gold/80"
                : "border-gold-glow/20 text-ivory-faint"
          }`;

          const labelClass = compact
            ? active
              ? "hidden truncate text-[10px] uppercase tracking-wider text-gold md:inline md:max-w-[5rem] lg:max-w-none"
              : "hidden truncate text-[10px] uppercase tracking-wider text-ivory-faint lg:inline lg:max-w-[5rem] xl:max-w-none"
            : `truncate text-[9px] uppercase tracking-wider sm:max-w-none ${
                active ? "text-gold" : "text-ivory-faint"
              } max-w-[3.25rem] sm:max-w-[4.5rem] md:max-w-none`;

          const stepContent = (
            <>
              <span className={badgeClass}>{step.num}</span>
              {compact ? (
                active ? (
                  <span className="hidden truncate text-[10px] uppercase tracking-wider text-gold md:inline md:max-w-[5rem] lg:max-w-none">
                    {labels[step.key]}
                  </span>
                ) : (
                  <span className="hidden truncate text-[10px] uppercase tracking-wider text-ivory-faint lg:inline lg:max-w-[5rem] xl:max-w-none">
                    {labels[step.key]}
                  </span>
                )
              ) : (
                <span className={labelClass}>{labels[step.key]}</span>
              )}
            </>
          );

          return (
            <li key={step.key} className="flex min-w-0 items-center gap-0.5 sm:gap-1">
              {canClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.key)}
                  className="group flex min-w-0 items-center gap-0.5 rounded-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gold sm:gap-1"
                  aria-label={t("goToStep", { step: labels[step.key] })}
                >
                  {stepContent}
                </button>
              ) : (
                <span
                  className="flex min-w-0 items-center gap-0.5 sm:gap-1"
                  title={labels[step.key]}
                  aria-current={active ? "step" : undefined}
                >
                  {stepContent}
                </span>
              )}
              {index < STEPS.length - 1 ? (
                <span
                  className={`mx-0.5 h-px w-2 shrink-0 sm:w-3 md:w-5 ${done ? "bg-gold/40" : "bg-gold-glow/15"}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
