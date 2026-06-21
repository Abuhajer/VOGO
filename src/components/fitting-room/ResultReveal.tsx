"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { localizeProduct } from "@/lib/products";
import type { FittingRoomProduct } from "@/lib/try-on/types";
import Button from "@/components/ui/Button";

type Props = {
  beforeUrl: string;
  afterUrl: string;
  product: FittingRoomProduct;
  /** Person photo dimensions — keeps compare frame aligned with the upload. */
  frameWidth?: number;
  frameHeight?: number;
  onTryAnother: () => void;
  onStartOver?: () => void;
};

const compareImgClass =
  "absolute inset-0 h-full w-full object-fill object-center";

function resolveFrameSize(
  frameWidth?: number,
  frameHeight?: number,
  naturalWidth?: number,
  naturalHeight?: number
): { width: number; height: number } | null {
  if (frameWidth && frameHeight) {
    return { width: frameWidth, height: frameHeight };
  }
  if (naturalWidth && naturalHeight) {
    return { width: naturalWidth, height: naturalHeight };
  }
  return null;
}

export default function ResultReveal({
  beforeUrl,
  afterUrl,
  product,
  frameWidth,
  frameHeight,
  onTryAnother,
  onStartOver,
}: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { name } = localizeProduct(product, locale);
  const [sliderPos, setSliderPos] = useState(50);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(() =>
    resolveFrameSize(frameWidth, frameHeight)
  );
  const draggingRef = useRef(false);

  useEffect(() => {
    const fromProps = resolveFrameSize(frameWidth, frameHeight);
    if (fromProps) {
      setFrameSize(fromProps);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const size = resolveFrameSize(undefined, undefined, img.naturalWidth, img.naturalHeight);
      if (size) setFrameSize(size);
    };
    img.src = beforeUrl;
  }, [beforeUrl, frameWidth, frameHeight]);

  const updateSlider = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = ((clientX - rect.left) / rect.width) * 100;
      const pos = Math.min(100, Math.max(0, x));
      setSliderPos(isAr ? 100 - pos : pos);
    },
    [isAr]
  );

  const releasePointer = useCallback((element: HTMLElement, pointerId: number) => {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
    draggingRef.current = false;
  }, []);

  const clipAfter = isAr
    ? `inset(0 0 0 ${100 - sliderPos}%)`
    : `inset(0 ${100 - sliderPos}% 0 0)`;

  const frameAspect =
    frameSize && frameSize.height > 0 ? frameSize.width / frameSize.height : 3 / 4;

  const actionButtons = (
    <>
      <Button
        variant="outline"
        onClick={onTryAnother}
        isArabic={isAr}
        className="!min-h-11 !px-4 !py-2.5 sm:!px-5"
      >
        {t("tryAnother")}
      </Button>
      <Link
        href={`/shop/${product.slug}`}
        className="inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-4 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0E0D12] transition-all hover:shadow-[0_0_20px_rgba(201,168,76,0.25)] sm:px-5"
      >
        {t("viewInShop")}
      </Link>
      {onStartOver ? (
        <button
          type="button"
          onClick={onStartOver}
          className="min-h-11 px-2 py-2 text-[9px] uppercase tracking-[0.15em] text-ivory-faint hover:text-gold"
        >
          {t("startOver")}
        </button>
      ) : null}
    </>
  );

  const stepMeta = (
    <>
      <p className="mb-0.5 text-[9px] uppercase tracking-[0.28em] text-gold sm:text-[10px]">
        {t("step4Label")}
      </p>
      <h2 className="font-serif text-lg leading-tight text-ivory sm:text-xl md:text-2xl">
        {t("step4Title")}
      </h2>
      <p className="mt-1 max-w-xl text-[11px] leading-snug text-ivory-muted/90 line-clamp-2 sm:text-xs">
        {t("step4Desc", { product: name })}
      </p>
    </>
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-8 xl:gap-10"
    >
      {/* Mobile — floating step intro (matches product/photo steps) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[#08080c]/96 via-[#08080c]/55 to-transparent px-3 pb-8 pt-1 sm:px-4 lg:hidden"
        aria-hidden={false}
      >
        {stepMeta}
      </div>

      {/* Compare stage — hero image, full height on mobile */}
      <div className="fitting-room-result-stage flex min-h-0 flex-1 items-center justify-center px-2 pb-1 pt-[5.5rem] sm:px-3 sm:pt-[6rem] lg:px-0 lg:pb-0 lg:pt-0">
        <div
          className="fitting-room-result-compare fitting-room-compare relative cursor-ew-resize select-none overflow-hidden rounded-sm border border-gold-glow/15 bg-obsidian shadow-[inset_0_0_40px_rgba(201,168,76,0.04)] touch-pan-x"
          style={{ ["--compare-aspect" as string]: String(frameAspect) }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateSlider(e.clientX, e.currentTarget.getBoundingClientRect());
          }}
          onPointerMove={(e) => {
            if (!draggingRef.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
            updateSlider(e.clientX, e.currentTarget.getBoundingClientRect());
          }}
          onPointerUp={(e) => {
            releasePointer(e.currentTarget, e.pointerId);
          }}
          onPointerCancel={(e) => {
            releasePointer(e.currentTarget, e.pointerId);
          }}
          onLostPointerCapture={() => {
            draggingRef.current = false;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt="" className={compareImgClass} draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: clipAfter }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={afterUrl} alt="" className={compareImgClass} draggable={false} />
          </div>
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-20 flex -translate-x-1/2 items-center justify-center"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="h-full w-0.5 bg-gold shadow-[0_0_12px_rgba(201,168,76,0.6)]" />
            <div className="absolute flex h-10 w-10 items-center justify-center rounded-full border border-gold bg-void/90 text-xs text-gold shadow-[0_4px_16px_rgba(0,0,0,0.4)] sm:h-11 sm:w-11 sm:text-sm">
              ↔
            </div>
          </div>
          <div className="pointer-events-none absolute start-2 top-2 z-20 rounded-sm bg-void/80 px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-ivory backdrop-blur-sm sm:start-3 sm:top-3 sm:px-2 sm:py-1 sm:text-[8px]">
            {t("before")}
          </div>
          <div className="pointer-events-none absolute end-2 top-2 z-20 rounded-sm bg-void/80 px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-gold backdrop-blur-sm sm:end-3 sm:top-3 sm:px-2 sm:py-1 sm:text-[8px]">
            {t("after")}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-void/90 via-void/40 to-transparent px-3 pb-2 pt-8 text-center lg:hidden">
            <p className="text-[8px] uppercase tracking-[0.16em] text-ivory-faint sm:text-[9px]">
              {t("dragHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop — side meta + actions */}
      <div className="relative z-10 hidden shrink-0 flex-col justify-center gap-4 text-start lg:flex lg:py-4">
        <div>{stepMeta}</div>
        <p className="text-[9px] uppercase tracking-[0.15em] text-ivory-faint">{t("dragHint")}</p>
        <div className="flex flex-wrap items-center justify-start gap-2 pt-1">{actionButtons}</div>
      </div>

      {/* Mobile — sticky actions */}
      <div className="relative z-20 flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-gold-glow/10 bg-surface/95 px-3 py-2.5 backdrop-blur-md lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {actionButtons}
      </div>
    </div>
  );
}
