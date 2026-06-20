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

const compareImgClass = "absolute inset-0 h-full w-full object-cover object-center";

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
    frameSize && frameSize.height > 0 ? frameSize.width / frameSize.height : 9 / 16;

  const actionButtons = (
    <>
      <Button
        variant="outline"
        onClick={onTryAnother}
        isArabic={isAr}
        className="!min-h-11 !px-5 !py-2.5"
      >
        {t("tryAnother")}
      </Button>
      <Link
        href={`/shop/${product.slug}`}
        className="inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-5 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0E0D12] transition-all hover:shadow-[0_0_20px_rgba(201,168,76,0.25)]"
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

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-8 xl:gap-10"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <div
          className="fitting-room-compare relative mx-auto w-full max-w-full cursor-ew-resize select-none overflow-hidden rounded-sm border border-gold-glow/10 touch-pan-x"
          style={{
            aspectRatio: frameAspect,
            height: frameSize ? "min(72vh, 820px)" : undefined,
            width: frameSize
              ? `min(100%, calc(min(72vh, 820px) * ${frameAspect}))`
              : undefined,
            maxHeight: "min(72vh, 820px)",
          }}
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
            <div className="absolute flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-void/90 text-sm text-gold shadow-[0_4px_16px_rgba(0,0,0,0.4)] sm:h-12 sm:w-12">
              ↔
            </div>
          </div>
          <div className="pointer-events-none absolute start-3 top-3 z-20 rounded-sm bg-void/80 px-2 py-1 text-[8px] uppercase tracking-wider text-ivory backdrop-blur-sm">
            {t("before")}
          </div>
          <div className="pointer-events-none absolute end-3 top-3 z-20 rounded-sm bg-void/80 px-2 py-1 text-[8px] uppercase tracking-wider text-gold backdrop-blur-sm">
            {t("after")}
          </div>
        </div>
        <p className="shrink-0 text-center text-[9px] uppercase tracking-[0.15em] text-ivory-faint lg:text-start">
          {t("dragHint")}
        </p>
      </div>

      <div className="relative z-10 flex shrink-0 flex-col justify-center gap-4 text-center lg:py-4 lg:text-start">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold">{t("step4Label")}</p>
          <h2 className="font-serif text-2xl text-ivory sm:text-3xl md:text-4xl">{t("step4Title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ivory-muted lg:mx-0 lg:max-w-none">
            {t("step4Desc", { product: name })}
          </p>
        </div>

        <div className="hidden flex-wrap items-center justify-start gap-2 pt-1 lg:flex">
          {actionButtons}
        </div>
      </div>

      <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 border-t border-gold-glow/10 bg-surface/95 px-3 py-3 backdrop-blur-md lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {actionButtons}
      </div>
    </div>
  );
}
