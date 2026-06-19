"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type IntroLoaderProps = {
  onComplete?: () => void;
};

let introPlayedThisLoad = false;

export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  const [showLoader, setShowLoader] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    introPlayedThisLoad = true;
    setShowLoader(false);
    onCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || introPlayedThisLoad) {
      onCompleteRef.current?.();
      return;
    }

    setShowLoader(true);

    const fallback = window.setTimeout(handleComplete, 5500);
    return () => window.clearTimeout(fallback);
  }, [handleComplete, prefersReducedMotion]);

  useGSAP(() => {
    if (!showLoader) return;

    const ctx = gsap.context(() => {
      gsap.set(logoRef.current, { opacity: 0, y: 28, scale: 0.94 });
      gsap.set(lineRef.current, { scaleX: 0, opacity: 0 });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.85 });

      const tl = gsap.timeline({ onComplete: handleComplete });

      tl.to(glowRef.current, {
        opacity: 0.45,
        scale: 1,
        duration: 1.1,
        ease: "power2.out",
      })
        .to(
          logoRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
          },
          "-=0.7"
        )
        .to(
          lineRef.current,
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.9,
            ease: "power4.inOut",
          },
          "-=0.45"
        );

      gsap.delayedCall(0.9, () => setShowSkip(true));

      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.65,
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
      duration: 0.3,
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
      <div
        ref={glowRef}
        className="absolute w-[480px] h-[480px] rounded-full bg-gold-glow filter blur-[120px] pointer-events-none opacity-0"
        aria-hidden
      />
      <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gold-glow/10" aria-hidden />
      <div className="absolute right-[10%] top-0 bottom-0 w-px bg-gold-glow/10" aria-hidden />

      <div
        ref={logoRef}
        className="relative z-10 w-56 h-14 sm:w-64 sm:h-16 md:w-72 md:h-[4.5rem] opacity-0"
      >
        <Image
          src="/logo/prime-logo.svg"
          alt="PRIME BY VOGO"
          fill
          sizes="(max-width: 640px) 224px, 288px"
          priority
          className="object-contain"
        />
      </div>

      <div
        ref={lineRef}
        className="relative z-10 w-48 md:w-56 h-px mt-6 bg-gradient-to-r from-transparent via-gold to-transparent origin-center scale-x-0 opacity-0"
        aria-hidden
      />

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
