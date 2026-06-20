"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRingCarousel } from "@/hooks/useRingCarousel";
import {
  getRingCarouselLayout,
  getRingItemTransform,
  getRingItemVisibility,
  getRingSpinnerTransform,
} from "@/lib/carousel3d/ring";
import { formatNumber } from "@/lib/format";

export type CoverflowCarouselVariant = "fitting-room" | "collection";

type RenderSlideArgs<T> = {
  item: T;
  index: number;
  isCenter: boolean;
  isSelected: boolean;
  onActivate: () => void;
};

type Props<T> = {
  items: T[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isRtl: boolean;
  locale: string;
  getItemKey: (item: T) => string;
  getItemLabel: (item: T) => string;
  isItemSelected?: (item: T) => boolean;
  renderSlide: (args: RenderSlideArgs<T>) => ReactNode;
  ariaLabel: string;
  prevLabel: string;
  nextLabel: string;
  variant?: CoverflowCarouselVariant;
  overlay?: ReactNode;
  showCounter?: boolean;
  showDots?: boolean;
  className?: string;
};

export default function CoverflowCarousel3D<T>({
  items,
  activeIndex,
  onActiveIndexChange,
  isRtl,
  locale,
  getItemKey,
  getItemLabel,
  isItemSelected,
  renderSlide,
  ariaLabel,
  prevLabel,
  nextLabel,
  variant = "fitting-room",
  overlay,
  showCounter = true,
  showDots = false,
  className = "",
}: Props<T>) {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleIndexChange = useCallback(
    (index: number) => {
      onActiveIndexChange(index);
    },
    [onActiveIndexChange]
  );

  const {
    activeIndex: currentIndex,
    goTo,
    goNext,
    goPrev,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handlePointerDown,
    handlePointerUp,
  } = useRingCarousel({
    itemCount: items.length,
    isRtl,
    selectedIndex: activeIndex,
    onIndexChange: handleIndexChange,
  });

  const layout = getRingCarouselLayout(items.length, isLarge);
  const activeItem = items[currentIndex];
  const spinnerTransform = getRingSpinnerTransform();

  return (
    <div
      className={`coverflow-carousel-shell coverflow-carousel-shell--${variant} ${className}`.trim()}
      data-variant={variant}
    >
      <div className={`coverflow-carousel-3d relative min-h-0 w-full flex-1`}>
        <div className="collection-3d-ambient pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 collection-3d-vignette" aria-hidden />
        {variant === "collection" ? (
          <div
            className="collection-3d-beam pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          />
        ) : null}
        <div
          className="coverflow-carousel-floor collection-3d-floor pointer-events-none absolute left-1/2 bottom-[4%] -translate-x-1/2"
          aria-hidden
        />

        <div
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={
            activeItem ? `coverflow-item-${getItemKey(activeItem)}` : undefined
          }
          tabIndex={0}
          className="coverflow-carousel-viewport relative h-full min-h-[inherit] w-full outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void rounded-sm"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="coverflow-carousel-ring relative z-0 h-full w-full cursor-grab active:cursor-grabbing">
            <div className="coverflow-carousel-spinner" style={{ transform: spinnerTransform }}>
              {items
                .map((item, index) => ({
                  item,
                  index,
                  offset: index - currentIndex,
                }))
                .filter(({ offset }) => !getRingItemVisibility(offset).hidden)
                .sort((a, b) => {
                  const depthOrder = Math.abs(b.offset) - Math.abs(a.offset);
                  if (depthOrder !== 0) return depthOrder;
                  return a.index - b.index;
                })
                .map(({ item, index, offset }) => {
                  const visibility = getRingItemVisibility(offset);
                  const itemTransform = getRingItemTransform(offset, layout, isRtl);
                  const isCenter = index === currentIndex;
                  const selected = isItemSelected?.(item) ?? false;

                  return (
                    <div
                      key={getItemKey(item)}
                      id={`coverflow-item-${getItemKey(item)}`}
                      role="option"
                      aria-selected={selected || isCenter}
                      aria-label={getItemLabel(item)}
                      aria-hidden={!isCenter}
                      className={`coverflow-carousel-item ${isCenter ? "is-center" : ""} ${
                        selected ? "is-selected" : ""
                      }`}
                      style={{
                        transform: itemTransform,
                        zIndex: visibility.zIndex,
                      }}
                    >
                      <div
                        className="coverflow-carousel-item-face h-full w-full"
                        style={{
                          opacity: visibility.opacity,
                          pointerEvents: visibility.pointerEvents,
                        }}
                      >
                        {renderSlide({
                          item,
                          index,
                          isCenter,
                          isSelected: selected,
                          onActivate: () => goTo(index),
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {showCounter && items.length > 0 && variant !== "collection" ? (
          <p className="pointer-events-none absolute bottom-2 inset-x-0 z-10 text-center text-[10px] tabular-nums tracking-widest text-ivory-faint sm:bottom-3 sm:text-[11px]">
            {formatNumber(currentIndex + 1, locale)} / {formatNumber(items.length, locale)}
          </p>
        ) : null}
      </div>

      {showCounter && items.length > 0 && variant === "collection" ? (
        <p
          className="collection-coverflow-counter pointer-events-none shrink-0 text-center text-[10px] tabular-nums tracking-widest text-ivory-faint sm:text-[11px]"
          aria-live="polite"
        >
          {formatNumber(currentIndex + 1, locale)} / {formatNumber(items.length, locale)}
        </p>
      ) : null}

      {overlay}

      {items.length > 1 ? (
        <>
          <button
            type="button"
            data-carousel-nav=""
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            disabled={currentIndex === 0}
            className="coverflow-carousel-nav absolute start-2 top-1/2 z-50 -translate-y-1/2 sm:start-3 md:start-4 rounded-sm border border-gold-glow/20 bg-void/90 p-2.5 text-gold backdrop-blur-sm transition-colors hover:border-gold/40 hover:bg-void/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:pointer-events-none disabled:opacity-30"
            aria-label={prevLabel}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            data-carousel-nav=""
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            disabled={currentIndex === items.length - 1}
            className="coverflow-carousel-nav absolute end-2 top-1/2 z-50 -translate-y-1/2 sm:end-3 md:end-4 rounded-sm border border-gold-glow/20 bg-void/90 p-2.5 text-gold backdrop-blur-sm transition-colors hover:border-gold/40 hover:bg-void/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:pointer-events-none disabled:opacity-30"
            aria-label={nextLabel}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M6 3L11 8L6 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}

      {showDots && items.length > 1 ? (
        <div className="relative z-10 mt-5 flex items-center justify-center gap-2.5">
          {items.map((item, index) => (
            <button
              key={getItemKey(item)}
              type="button"
              data-carousel-nav=""
              onClick={() => goTo(index)}
              className={`carousel-dot h-1.5 w-1.5 rounded-full bg-gold-muted/30 transition-all duration-500 ${
                index === currentIndex ? "is-active" : ""
              }`}
              aria-label={`${getItemLabel(item)} (${formatNumber(index + 1, locale)})`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
