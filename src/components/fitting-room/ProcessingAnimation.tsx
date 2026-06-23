"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { formatNumber } from "@/lib/format";
import { localizeProduct } from "@/lib/products";
import type { FittingRoomProduct } from "@/lib/try-on/types";
import type { TryOnProgressUpdate } from "@/lib/try-on/progress";
import { phaseToStageIndex } from "@/lib/try-on/progress";

type Props = {
  compact?: boolean;
  product?: FittingRoomProduct | null;
  personImageUrl?: string | null;
  /** Live server progress — disables fake looping timer when set */
  generationProgress?: TryOnProgressUpdate | null;
};

const STAGE_KEYS = [
  "processingStage1",
  "processingStage2",
  "processingStage3",
  "processingStage4",
] as const;

const TIP_KEYS = [
  "processingTip1",
  "processingTip2",
  "processingTip3",
  "processingTip4",
  "processingTip5",
  "processingTip6",
] as const;

const STAGE_MS = 9000;
const TIP_MS = 4500;
const TICK_MS = 180;

function ProgressRing({
  progress,
  size = 88,
  stroke = 3,
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="atelier-progress-ring -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(201, 168, 76, 0.12)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#atelierProgressGradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="atelier-progress-ring-arc transition-[stroke-dashoffset] duration-500 ease-out"
      />
      <defs>
        <linearGradient id="atelierProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(201, 168, 76, 0.55)" />
          <stop offset="50%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="rgba(201, 168, 76, 0.75)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProcessingAnimation({
  product,
  personImageUrl,
  generationProgress,
}: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const prefersReducedMotion = useReducedMotion();
  const liveProgress = generationProgress != null;

  const [stageIndex, setStageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const stageStartRef = useRef(Date.now());

  const productName = useMemo(() => {
    if (!product) return null;
    return localizeProduct(product, locale).name;
  }, [product, locale]);

  useEffect(() => {
    if (liveProgress || prefersReducedMotion) return;

    const stageTimer = window.setInterval(() => {
      stageStartRef.current = Date.now();
      setStageIndex((i) => Math.min(i + 1, STAGE_KEYS.length - 1));
    }, STAGE_MS);

    const tipTimer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIP_KEYS.length);
    }, TIP_MS);

    const tickTimer = window.setInterval(() => {
      setTick((n) => n + 1);
    }, TICK_MS);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(tipTimer);
      window.clearInterval(tickTimer);
    };
  }, [liveProgress, prefersReducedMotion]);

  const liveStageIndex = liveProgress
    ? phaseToStageIndex(generationProgress.phase)
    : stageIndex;

  const displayProgress = useMemo(() => {
    if (liveProgress) {
      return Math.min(100, Math.max(0, Math.round(generationProgress.percent)));
    }
    void tick;
    if (prefersReducedMotion) return Math.round(((stageIndex + 1) / STAGE_KEYS.length) * 100);

    const stageFraction = Math.min(0.92, (Date.now() - stageStartRef.current) / STAGE_MS);
    return Math.min(
      99,
      Math.round(((stageIndex + stageFraction) / STAGE_KEYS.length) * 100)
    );
  }, [liveProgress, generationProgress, tick, stageIndex, prefersReducedMotion]);

  const stageSegmentProgress = useMemo(() => {
    if (liveProgress) {
      if (
        generationProgress.phase === "generate" &&
        generationProgress.step != null &&
        generationProgress.totalSteps
      ) {
        return Math.round((generationProgress.step / generationProgress.totalSteps) * 100);
      }
      if (generationProgress.phase === "finalize") return 100;
      return displayProgress;
    }
    void tick;
    if (prefersReducedMotion) return stageIndex >= STAGE_KEYS.length - 1 ? 100 : 50;
    const stageFraction = Math.min(1, (Date.now() - stageStartRef.current) / STAGE_MS);
    return Math.round(stageFraction * 100);
  }, [liveProgress, generationProgress, displayProgress, tick, stageIndex, prefersReducedMotion]);

  const currentStage = t(STAGE_KEYS[liveStageIndex]);
  const currentTip = t(TIP_KEYS[tipIndex]);
  const progressLabel = `${formatNumber(displayProgress, locale)}%`;

  const processingIntro = (
    <>
      <p className="text-[8px] uppercase tracking-[0.22em] text-gold sm:text-[9px]">
        {t("stepProcessing")}
      </p>
      <h2 className="mt-0.5 font-serif text-sm leading-snug text-ivory sm:text-base md:text-lg">
        {t("processingTitle")}
      </h2>
      <p className="mt-1 text-[9px] leading-snug text-ivory-muted/90 line-clamp-2 sm:text-[10px] md:text-[11px]">
        {t("processingDesc")}
      </p>
    </>
  );

  const progressRail = (compact: boolean) => (
    <aside
      className={`atelier-processing-rail flex shrink-0 flex-col ${
        compact ? "w-full" : "hidden w-[4.5rem] sm:flex sm:w-20 md:w-[5.5rem]"
      }`}
      dir={isAr ? "rtl" : "ltr"}
      aria-label={t("processingTitle")}
    >
      <div
        className={`flex ${
          compact ? "w-full flex-row items-center gap-3" : "relative mx-auto mb-3 flex-col items-center sm:mb-4"
        }`}
      >
        <div className="relative shrink-0">
          <ProgressRing progress={displayProgress} size={compact ? 52 : 72} stroke={2.5} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-serif leading-none text-gold tabular-nums ${
                compact ? "text-base" : "text-xl sm:text-2xl"
              }`}
            >
              {formatNumber(displayProgress, locale)}
            </span>
            <span className="mt-0.5 text-[7px] uppercase tracking-[0.2em] text-gold/70 sm:text-[8px]">
              %
            </span>
          </div>
        </div>
        {compact ? (
          <div className="min-w-0 flex-1 text-start">
            <p
              key={liveStageIndex}
              className="text-[9px] font-medium uppercase tracking-[0.12em] text-gold"
            >
              {currentStage}
            </p>
            <p
              key={tipIndex}
              className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-ivory-muted/90"
            >
              {currentTip}
            </p>
          </div>
        ) : null}
        {!compact && !prefersReducedMotion ? (
          <span className="atelier-processing-pulse mt-2 h-1 w-1 rounded-full bg-gold/80" aria-hidden />
        ) : null}
      </div>

      {!compact ? (
        <>
          <nav className="flex min-h-0 flex-1 flex-col justify-center">
            {STAGE_KEYS.map((key, index) => {
              const active = index === liveStageIndex;
              const done = index < liveStageIndex;
              const upcoming = index > liveStageIndex;

              return (
                <div key={key} className="flex items-stretch gap-1.5 sm:gap-2">
                  <div className="flex flex-col items-center pt-0.5">
                    <span
                      className={`relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                        active
                          ? "bg-gold atelier-processing-step-active shadow-[0_0_12px_rgba(201,168,76,0.55)]"
                          : done
                            ? "bg-gold/60"
                            : "border border-gold-muted/30 bg-void/80"
                      }`}
                    >
                      {active && !prefersReducedMotion ? (
                        <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" aria-hidden />
                      ) : null}
                    </span>
                    {index < STAGE_KEYS.length - 1 ? (
                      <span className="relative my-0.5 min-h-[1.35rem] w-px flex-1 overflow-hidden bg-gold-muted/15 sm:min-h-[1.6rem]">
                        <span
                          className="absolute inset-x-0 top-0 w-full bg-gradient-to-b from-gold/70 to-gold/30 transition-[height] duration-700 ease-out"
                          style={{
                            height: done ? "100%" : active ? `${stageSegmentProgress}%` : "0%",
                          }}
                        />
                      </span>
                    ) : null}
                  </div>
                  <div className={`pb-3 sm:pb-3.5 ${index === STAGE_KEYS.length - 1 ? "pb-0" : ""}`}>
                    <span
                      className={`block text-start text-[7px] uppercase leading-snug tracking-[0.1em] sm:text-[8px] ${
                        active
                          ? "font-medium text-gold"
                          : done
                            ? "text-ivory-muted"
                            : upcoming
                              ? "text-ivory-faint/70"
                              : "text-ivory-faint"
                      }`}
                    >
                      {t(key)}
                    </span>
                    {active ? (
                      <span className="mt-0.5 block text-[6px] tabular-nums text-gold/60 sm:text-[7px]">
                        {liveProgress &&
                        generationProgress?.phase === "generate" &&
                        generationProgress.step != null &&
                        generationProgress.totalSteps
                          ? `${formatNumber(generationProgress.step, locale)} / ${formatNumber(generationProgress.totalSteps, locale)}`
                          : `${formatNumber(stageSegmentProgress, locale)}%`}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </nav>

          <div
            key={tipIndex}
            className={`mt-auto rounded-sm border border-gold-glow/12 bg-void/55 p-2 backdrop-blur-sm ${
              prefersReducedMotion ? "" : "atelier-processing-tip"
            }`}
          >
            <p className="text-[6px] uppercase tracking-[0.18em] text-gold/80 sm:text-[7px]">
              {t("processingTipLabel")}
            </p>
            <p className="mt-1 line-clamp-3 text-[7px] leading-relaxed text-ivory-muted/90 sm:text-[8px]">
              {currentTip}
            </p>
          </div>
        </>
      ) : null}
    </aside>
  );

  return (
    <div
      className="atelier-processing-root relative flex min-h-0 w-full flex-1 flex-col"
      dir={isAr ? "rtl" : "ltr"}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="shrink-0 border-b border-gold-glow/10 px-3 py-2 sm:px-4 md:hidden">
        {processingIntro}
      </div>

      <div
        className="pointer-events-none absolute end-4 top-4 z-40 hidden max-w-xs md:block lg:end-5 lg:top-5"
        aria-hidden={false}
      >
        <div className="rounded-sm border border-gold-glow/20 bg-void/82 px-3.5 py-2.5 shadow-[0_10px_36px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {processingIntro}
        </div>
      </div>

      <p className="sr-only">
        {currentStage} — {progressLabel}
      </p>

      <div
        className="atelier-processing-row relative mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col items-center justify-center gap-2 px-2 pb-1 pt-2 sm:flex-row sm:gap-3 sm:px-3 sm:pt-0"
        dir="ltr"
      >
        <div className="atelier-processing-canvas relative min-h-0 shrink overflow-hidden rounded-sm border border-gold-glow/25 bg-void/70 shadow-[inset_0_0_60px_rgba(201,168,76,0.06),0_24px_64px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute inset-0 atelier-processing-vignette" aria-hidden />
          <div className="pointer-events-none absolute inset-0 atelier-processing-grain" aria-hidden />

          {!prefersReducedMotion ? (
            <>
              <span className="atelier-processing-corner atelier-processing-corner--tl" aria-hidden />
              <span className="atelier-processing-corner atelier-processing-corner--tr" aria-hidden />
              <span className="atelier-processing-corner atelier-processing-corner--bl" aria-hidden />
              <span className="atelier-processing-corner atelier-processing-corner--br" aria-hidden />
            </>
          ) : null}

          {personImageUrl ? (
            <Image
              src={personImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, 420px"
              className="object-contain opacity-90"
              unoptimized={personImageUrl.startsWith("data:") || personImageUrl.startsWith("/uploads")}
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-16 rounded-sm border border-gold-glow/20 bg-surface/80" aria-hidden />
            </div>
          )}

          {product ? (
            <div className="atelier-processing-garment absolute inset-0">
              <Image
                src={product.imageSrc}
                alt=""
                fill
                sizes="(max-width: 640px) 70vw, 420px"
                className="object-contain"
                priority
              />
            </div>
          ) : null}

          {!prefersReducedMotion ? (
            <>
              <div className="atelier-processing-scan" aria-hidden />
              <div className="atelier-processing-measure" aria-hidden />
              <svg
                className="atelier-processing-stitch absolute inset-0 h-full w-full text-gold/50"
                viewBox="0 0 200 250"
                fill="none"
                aria-hidden
              >
                <path
                  className="atelier-processing-stitch-path"
                  d="M36 42 C 72 28, 128 28, 164 42 L 170 118 C 168 156, 152 188, 100 198 C 48 188, 32 156, 30 118 Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="4 7"
                />
              </svg>
              <div className="atelier-processing-needle" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 1L10.5 7.5L16 9L10.5 10.5L9 17L7.5 10.5L2 9L7.5 7.5L9 1Z"
                    fill="currentColor"
                    className="text-gold"
                  />
                </svg>
              </div>
            </>
          ) : null}

          <div className="absolute start-3 top-3 z-10 rounded-sm border border-gold/25 bg-void/75 px-2 py-1 backdrop-blur-sm">
            <span className="text-[8px] uppercase tracking-[0.18em] text-gold/90">
              {formatNumber(liveStageIndex + 1, locale)} / {formatNumber(STAGE_KEYS.length, locale)}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 via-void/60 to-transparent px-3 pb-3 pt-10">
            {productName ? (
              <p className="truncate font-serif text-xs text-ivory sm:text-sm">{productName}</p>
            ) : null}
            {!prefersReducedMotion ? (
              <p
                key={liveStageIndex}
                className="atelier-processing-stage-label mt-1 truncate text-[8px] uppercase tracking-[0.16em] text-gold/85 sm:text-[9px]"
              >
                {currentStage}
              </p>
            ) : null}
          </div>
        </div>

        {progressRail(false)}
      </div>

      <div className="shrink-0 border-t border-gold-glow/10 px-3 py-2.5 sm:hidden">
        {progressRail(true)}
      </div>
    </div>
  );
}
