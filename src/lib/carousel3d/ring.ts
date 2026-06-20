/** Coverflow-style 3D carousel math (manual index, fixed arc — not full 360° ring). */

export type CoverflowLayout = {
  /** Degrees between each visible slot on the arc */
  angleStep: number;
  /** Horizontal arc radius (translateX / cylinder math) */
  radius: number;
  /** Max slots visible on each side of center */
  visibleRange: number;
  /** Center card translateZ — pulled toward viewer */
  centerLift: number;
  /** Extra translateZ recession per |offset| step (sides only) */
  recessPerStep: number;
};

export function getCoverflowLayout(isLarge = false): CoverflowLayout {
  return {
    angleStep: isLarge ? 50 : 42,
    radius: isLarge ? 380 : 280,
    visibleRange: 2,
    centerLift: isLarge ? 120 : 90,
    recessPerStep: isLarge ? 60 : 48,
  };
}

export function getRingDirectionMultiplier(isRtl: boolean): number {
  return isRtl ? -1 : 1;
}

/** Center the spinner in the stage (no ring rotation — items move by offset). */
export function getCoverflowStageTransform(): string {
  return "translate(-50%, -50%)";
}

/**
 * Per-item transform from offset relative to active index.
 * Center (offset 0) faces the viewer; sides rotate away with scale + depth falloff.
 */
export function getCoverflowItemTransform(
  offset: number,
  layout: CoverflowLayout,
  isRtl: boolean
): string {
  const dir = getRingDirectionMultiplier(isRtl);
  const abs = Math.abs(offset);
  const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.72;
  const angleDeg = offset * layout.angleStep * dir;
  const angleRad = (angleDeg * Math.PI) / 180;

  const translateX = layout.radius * Math.sin(angleRad);
  // Cylinder recess: sides sit behind center (negative Z); depth uses |offset| only (RTL-safe).
  const arcRecess = layout.radius * (1 - Math.cos(angleRad));
  const translateZ =
    abs === 0 ? layout.centerLift : -(arcRecess + abs * layout.recessPerStep);

  // Swiper-style order: X → rotateY → Z → scale so rotated faces recede correctly.
  return `translateX(${translateX}px) rotateY(${angleDeg}deg) translateZ(${translateZ}px) scale(${scale})`;
}

export function getCoverflowItemVisibility(offset: number, visibleRange: number): {
  opacity: number;
  zIndex: number;
  pointerEvents: "auto" | "none";
  hidden: boolean;
} {
  const abs = Math.abs(offset);
  if (abs > visibleRange) {
    return { opacity: 0, zIndex: 0, pointerEvents: "none", hidden: true };
  }
  return {
    opacity: abs === 0 ? 1 : abs === 1 ? 0.58 : 0.38,
    // Wide spread so neighbors always paint under center even if 3D rounding ties.
    zIndex: abs === 0 ? 200 : abs === 1 ? 60 : 10,
    pointerEvents: abs === 0 ? "auto" : "none",
    hidden: false,
  };
}

/** @deprecated Use getCoverflowLayout — kept for homepage if imported elsewhere */
export type RingCarouselLayout = CoverflowLayout;

export function getRingCarouselLayout(itemCount: number, isLarge = false): CoverflowLayout {
  void itemCount;
  return getCoverflowLayout(isLarge);
}

export function getRingSpinnerTransform(): string {
  return getCoverflowStageTransform();
}

export function getRingItemTransform(
  offset: number,
  layout: CoverflowLayout,
  isRtl: boolean
): string {
  return getCoverflowItemTransform(offset, layout, isRtl);
}

export function getRingItemVisibility(offset: number): {
  opacity: number;
  zIndex: number;
  pointerEvents: "auto" | "none";
  hidden: boolean;
} {
  const v = getCoverflowItemVisibility(offset, 2);
  return {
    opacity: v.opacity,
    zIndex: v.zIndex,
    pointerEvents: v.pointerEvents,
    hidden: v.hidden,
  };
}
