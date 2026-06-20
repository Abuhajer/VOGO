"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hasSeenIntroThisSession, markIntroSeenThisSession } from "@/lib/intro";
import { BRAND_LOGO } from "@/lib/brand";

type IntroLoaderProps = {
  onComplete?: () => void;
};

export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  const [showLoader, setShowLoader] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    markIntroSeenThisSession();
    setShowLoader(false);
    onCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || hasSeenIntroThisSession()) {
      onCompleteRef.current?.();
      return;
    }

    setShowLoader(true);

    const fallback = window.setTimeout(handleComplete, 4500);
    return () => window.clearTimeout(fallback);
  }, [handleComplete, prefersReducedMotion]);

  useGSAP(() => {
    if (!showLoader) return;

    const ctx = gsap.context(() => {
      gsap.set(lineRef.current, { scaleX: 0, opacity: 0 });
      gsap.set(logoRef.current, { y: 24, opacity: 0, scaleX: 0.94, scaleY: 0.94, filter: "blur(6px)" });

      const tl = gsap.timeline({ onComplete: handleComplete });

      tl.to(lineRef.current, {
        scaleX: 1,
        opacity: 1,
        duration: 0.8,
        ease: "power4.inOut",
      }).to(
        logoRef.current,
        {
          y: 0,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
        },
        "-=0.25"
      );

      gsap.delayedCall(1, () => setShowSkip(true));

      tl.to(
        containerRef.current,
        {
          opacity: 0,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 0.55,
          ease: "power3.inOut",
        },
        "+=0.35"
      );
    }, containerRef);

    return () => ctx.revert();
  }, [showLoader, handleComplete]);

  const handleSkip = () => {
    gsap.killTweensOf(containerRef.current);
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.28,
      ease: "power3.out",
      onComplete: handleComplete,
    });
  };

  if (!showLoader) return null;

  return (
    <div
      ref={containerRef}
      dir="ltr"
      lang="en"
      className="surface-dark fixed inset-0 z-[9999] bg-[#050508] flex flex-col items-center justify-center overflow-hidden"
      aria-live="polite"
      aria-busy="true"
      aria-label={isArabic ? "جاري تحميل الموقع" : "Loading site"}
    >
      <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gold-glow/10" aria-hidden />
      <div className="absolute right-[10%] top-0 bottom-0 w-px bg-gold-glow/10" aria-hidden />

      <div
        ref={lineRef}
        className="relative z-10 w-48 md:w-56 h-px mb-8 bg-gradient-to-r from-transparent via-gold to-transparent origin-center scale-x-0 opacity-0"
        aria-hidden
      />

      <div ref={logoRef} className="relative z-10 w-40 h-28 md:w-48 md:h-32 opacity-0">
        <Image
          src={BRAND_LOGO.path}
          alt={BRAND_LOGO.alt}
          fill
          priority
          sizes="200px"
          className="object-contain"
        />
      </div>

      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          className={`absolute bottom-10 z-20 text-xs tracking-[0.2em] uppercase text-ivory-faint hover:text-gold transition-colors duration-300 font-sans ${
            isArabic ? "left-10" : "right-10"
          }`}
        >
          {isArabic ? "تخطي" : "Skip"}
        </button>
      )}
    </div>
  );
}
