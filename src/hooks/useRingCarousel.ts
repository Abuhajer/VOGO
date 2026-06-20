"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  itemCount: number;
  isRtl: boolean;
  selectedIndex: number;
  onIndexChange: (index: number) => void;
};

const SWIPE_THRESHOLD = 40;

export function useRingCarousel({ itemCount, isRtl, selectedIndex, onIndexChange }: Options) {
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const activeIndexRef = useRef(activeIndex);
  const touchStartX = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const dragTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < itemCount && selectedIndex !== activeIndexRef.current) {
      setActiveIndex(selectedIndex);
    }
  }, [selectedIndex, itemCount]);

  const clampIndex = useCallback(
    (index: number) => {
      if (itemCount <= 0) return 0;
      return Math.max(0, Math.min(index, itemCount - 1));
    },
    [itemCount]
  );

  const goTo = useCallback(
    (index: number) => {
      const next = clampIndex(index);
      if (next === activeIndexRef.current) return;
      activeIndexRef.current = next;
      setActiveIndex(next);
      onIndexChange(next);
    },
    [clampIndex, onIndexChange]
  );

  const goNext = useCallback(() => {
    goTo(activeIndexRef.current + 1);
  }, [goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndexRef.current - 1);
  }, [goTo]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const rtlFlip = isRtl ? -1 : 1;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (rtlFlip === 1) goNext();
        else goPrev();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (rtlFlip === 1) goPrev();
        else goNext();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(itemCount - 1);
      }
    },
    [goNext, goPrev, goTo, isRtl, itemCount]
  );

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("[data-carousel-nav], [data-carousel-card]"));
  };

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (isInteractiveTarget(event.target)) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      if (start === null) return;

      const endX = event.changedTouches[0]?.clientX;
      if (endX === undefined) return;

      const delta = endX - start;
      const rtlFlip = isRtl ? -1 : 1;
      if (delta * rtlFlip < -SWIPE_THRESHOLD) goNext();
      else if (delta * rtlFlip > SWIPE_THRESHOLD) goPrev();
    },
    [goNext, goPrev, isRtl]
  );

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button !== 0 || isInteractiveTarget(event.target)) return;
    pointerStartX.current = event.clientX;
    dragTargetRef.current = event.currentTarget;
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (dragTargetRef.current !== event.currentTarget) return;

      const start = pointerStartX.current;
      pointerStartX.current = null;
      dragTargetRef.current = null;
      if (start === null) return;

      const delta = event.clientX - start;
      if (Math.abs(delta) < 8) return;

      const rtlFlip = isRtl ? -1 : 1;
      if (delta * rtlFlip < -SWIPE_THRESHOLD) goNext();
      else if (delta * rtlFlip > SWIPE_THRESHOLD) goPrev();
    },
    [goNext, goPrev, isRtl]
  );

  return {
    activeIndex,
    goTo,
    goNext,
    goPrev,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handlePointerDown,
    handlePointerUp,
  };
}
