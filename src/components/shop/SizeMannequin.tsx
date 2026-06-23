"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import {
  type MannequinHighlight,
  type MannequinMeasurements,
  MANNEQUIN_BASELINE,
  mannequinScales,
} from "@/lib/size-mannequin";

type SizeMannequinProps = {
  measurements: MannequinMeasurements;
  highlight?: MannequinHighlight;
  label?: string | null;
  subdued?: boolean;
  compact?: boolean;
};

export default function SizeMannequin({
  measurements,
  highlight = null,
  label = null,
  subdued = false,
  compact = false,
}: SizeMannequinProps) {
  const t = useTranslations("Shop.sizes");
  const svgRef = useRef<SVGSVGElement>(null);
  const figureRef = useRef<SVGGElement>(null);
  const torsoRef = useRef<SVGGElement>(null);
  const shouldersRef = useRef<SVGGElement>(null);
  const legsRef = useRef<SVGGElement>(null);
  const armsRef = useRef<SVGGElement>(null);
  const chestGuideRef = useRef<SVGLineElement>(null);
  const waistGuideRef = useRef<SVGLineElement>(null);
  const sleeveGuideRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const scales = mannequinScales(measurements);
    const duration = 0.5;
    const ease = "power2.out";

    if (figureRef.current) {
      gsap.to(figureRef.current, {
        scaleY: scales.heightScale,
        duration,
        ease,
        transformOrigin: "50% 92%",
      });
    }
    if (shouldersRef.current) {
      gsap.to(shouldersRef.current, {
        scaleX: scales.shoulderScale,
        duration,
        ease,
        transformOrigin: "50% 100%",
      });
    }
    if (torsoRef.current) {
      gsap.to(torsoRef.current, {
        scaleX: (scales.chestScale + scales.waistScale) / 2,
        scaleY: scales.torsoLengthScale,
        duration,
        ease,
        transformOrigin: "50% 0%",
      });
    }
    if (armsRef.current) {
      gsap.to(armsRef.current, {
        scaleY: scales.sleeveScale,
        duration,
        ease,
        transformOrigin: "50% 0%",
      });
    }
    if (legsRef.current) {
      gsap.to(legsRef.current, {
        scaleX: scales.waistScale * 0.92,
        duration,
        ease,
        transformOrigin: "50% 0%",
      });
    }
  }, [measurements]);

  useEffect(() => {
    const guides = [
      { ref: chestGuideRef, active: highlight === "chestCm" },
      { ref: waistGuideRef, active: highlight === "waistCm" },
      { ref: sleeveGuideRef, active: highlight === "sleeveCm" },
    ];

    for (const guide of guides) {
      if (!guide.ref.current) continue;
      gsap.to(guide.ref.current, {
        opacity: guide.active ? 1 : 0.35,
        strokeWidth: guide.active ? 1.4 : 0.9,
        duration: 0.25,
      });
    }
  }, [highlight]);

  const opacity = subdued ? 0.45 : 1;

  return (
    <div
      className={`flex flex-col items-center ${compact ? "gap-2" : "gap-3"}`}
      aria-hidden={subdued}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 200"
        className={`${compact ? "h-40 w-20" : "h-52 w-24 sm:h-56 sm:w-28"} text-gold`}
        role="img"
        aria-label={t("mannequinAria")}
      >
        <line
          x1="12"
          y1="188"
          x2="88"
          y2="188"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="0.75"
        />

        <g ref={figureRef} style={{ opacity }}>
          <g ref={shouldersRef}>
            <ellipse cx="50" cy="26" rx="11" ry="13" fill="currentColor" fillOpacity="0.22" />
            <ellipse cx="50" cy="26" rx="11" ry="13" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.75" />
          </g>

          <g ref={armsRef}>
            <path
              d="M28 46 C22 62 20 78 22 94"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M72 46 C78 62 80 78 78 94"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          <g ref={torsoRef}>
            <path
              d="M34 40 Q50 36 66 40 L72 108 Q50 118 28 108 Z"
              fill="currentColor"
              fillOpacity="0.18"
              stroke="currentColor"
              strokeOpacity="0.4"
              strokeWidth="0.85"
              strokeLinejoin="round"
            />
          </g>

          <g ref={legsRef}>
            <path
              d="M38 108 L34 182 M62 108 L66 182"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>

          <line
            ref={chestGuideRef}
            x1="18"
            y1="58"
            x2="82"
            y2="58"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="0.9"
            strokeDasharray="3 2"
          />
          <line
            ref={waistGuideRef}
            x1="22"
            y1="88"
            x2="78"
            y2="88"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="0.9"
            strokeDasharray="3 2"
          />
          <line
            ref={sleeveGuideRef}
            x1="72"
            y1="46"
            x2="78"
            y2="94"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="0.9"
            strokeDasharray="2 2"
          />
        </g>
      </svg>

      {label ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold text-center">{label}</p>
      ) : subdued ? (
        <p className="text-[10px] uppercase tracking-[0.14em] text-ivory-faint text-center max-w-[9rem] leading-relaxed">
          {t("mannequinHint")}
        </p>
      ) : null}

      {!subdued ? (
        <p className="text-[9px] text-ivory-faint/80 text-center" dir="ltr">
          {measurements.chestCm}/{measurements.waistCm} cm
        </p>
      ) : null}
    </div>
  );
}
