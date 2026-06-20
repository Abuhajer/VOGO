"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { siteImages } from "@/lib/images";
import { scrollToSection } from "@/lib/scroll";
type HeroSectionProps = {
  introReady?: boolean;
};

export default function HeroSection({ introReady = true }: HeroSectionProps) {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  const prefersReducedMotion = useReducedMotion();

  useGSAP(() => {
    const headlineSelector = ".hero-word";

    if (!introReady) {
      gsap.set(headlineSelector, { y: "100%", opacity: 0 });
      gsap.set(".hero-sub", { opacity: 0, y: 15 });
      gsap.set(lineRef.current, { scaleX: 0 });
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });
      return;
    }

    if (!prefersReducedMotion) {
      const tl = gsap.timeline({ delay: 0.2 });

      gsap.set(headlineSelector, { y: "100%", opacity: 0 });
      gsap.set(".hero-sub", { opacity: 0, y: 15 });
      gsap.set(lineRef.current, { scaleX: 0 });
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });

      tl.fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: "power4.inOut" }
      );

      tl.to(
        headlineSelector,
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 1.2,
          ease: "power3.out",
        },
        "-=0.6"
      );

      tl.fromTo(
        ".hero-sub",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.4"
      );

      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.6"
      );
    } else {
      gsap.set(".hero-word", { y: 0, opacity: 1 });
      gsap.set(".hero-sub", { opacity: 1, y: 0 });
      gsap.set(lineRef.current, { scaleX: 1 });
      gsap.set(ctaRef.current, { opacity: 1, y: 0 });
    }

    // 2. Parallax scroll effect
    if (!prefersReducedMotion && bgRef.current) {
      gsap.to(bgRef.current, {
        yPercent: 18,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
          fastScrollEnd: true,
        },
      });

      if (grainRef.current) {
        gsap.to(grainRef.current, {
          yPercent: 28,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
            fastScrollEnd: true,
          },
        });
      }

      gsap.to(textContainerRef.current, {
        yPercent: -8,
        opacity: 0.2,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom 30%",
          scrub: 0.5,
          fastScrollEnd: true,
        },
      });
    }
  }, { scope: sectionRef, dependencies: [prefersReducedMotion, isArabic, introReady] });

  const renderHeadline = (text: string) => {
    if (isArabic) {
      return text.split(" ").map((word, idx) => (
        <span key={idx} className="inline-block overflow-hidden ms-[0.2em] first:ms-0">
          <span className="hero-word inline-block font-serif text-gold font-normal leading-[1.5]">
            {word}
          </span>
        </span>
      ));
    }

    // English: one connected line — per-word clip boxes distort italic serifs
    return (
      <span className="inline-block overflow-hidden max-w-4xl">
        <span className="hero-word block font-serif text-gold font-light not-italic leading-[1.15] tracking-normal">
          {text}
        </span>
      </span>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="surface-dark relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#050508]"
      id="hero"
    >
      {/* Parallax Background Container */}
      <div
        ref={bgRef}
        className="absolute inset-0 w-full h-[120%] -top-[10%] z-0 will-change-transform"
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-[#050508]/40 z-10 pointer-events-none" />
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, transparent 30%, rgba(5, 5, 8, 0.75) 100%)",
          }}
        />
        
        {/* Next.js Optimized Background Image */}
        <Image
          src={siteImages.hero}
          alt="VOGO BY FAME bespoke suit"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div
        ref={grainRef}
        className="hero-grain-layer absolute inset-0 z-[5] pointer-events-none"
        aria-hidden
      />

      {/* Decorative vertical lines */}
      <div className="absolute left-[10%] top-0 bottom-0 w-[1px] bg-gold-glow opacity-10 z-10 hidden md:block" />
      <div className="absolute right-[10%] top-0 bottom-0 w-[1px] bg-gold-glow opacity-10 z-10 hidden md:block" />

      {/* Hero Content */}
      <div
        ref={textContainerRef}
        className="relative z-25 container mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-8"
      >
        {/* Cinematic Headline */}
        <h1
          className={`font-light max-w-4xl text-balance ${
            isArabic
              ? "text-5xl md:text-7xl lg:text-[5.25rem] leading-[1.45]"
              : "text-4xl md:text-6xl lg:text-7xl leading-[1.15]"
          }`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          {renderHeadline(t("tagline"))}
        </h1>

        {/* Decorative Gold Rule */}
        <div
          ref={lineRef}
          className="w-24 md:w-36 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent my-6 origin-center"
        />

        {/* Brand Statement Subtitle */}
        <p
          className={`hero-sub max-w-xl text-ivory-muted font-sans leading-relaxed text-balance ${
            isArabic ? "text-base md:text-lg" : "text-sm md:text-base"
          }`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          {t("subtitle")}
        </p>

        {/* Call to Actions */}
        <div
          ref={ctaRef}
          className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6"
        >
          <a
            href="#collection"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("#collection");
            }}
            className={`group px-8 py-3.5 rounded-sm border border-gold-muted text-gold font-sans text-xs font-medium transition-all duration-300 hover:bg-gold/10 ${
              isArabic ? "" : "uppercase tracking-[0.2em]"
            }`}
          >
            {t("ctaShop")}
          </a>
          <a
            href="#story"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("#story");
            }}
            className={`group relative px-8 py-3.5 overflow-hidden rounded-sm bg-gold text-[#0E0D12] font-sans text-xs font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(201,168,76,0.3)] ${
              isArabic ? "" : "uppercase tracking-[0.2em]"
            }`}
          >
            <span className="relative z-10">{t("ctaStory")}</span>
            <span className="absolute inset-0 bg-ivory scale-x-0 origin-left transition-transform duration-500 ease-fabric group-hover:scale-x-100" />
          </a>
        </div>
      </div>

      {/* Infinite Scroll Indicator */}
      <a
        href="#collection"
        onClick={(event) => {
          event.preventDefault();
          scrollToSection("#collection");
        }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center space-y-2 opacity-70 hover:opacity-100 transition-opacity duration-300"
      >
        <span
          className={`text-[9px] text-ivory-muted font-sans font-light ${
            isArabic ? "" : "tracking-[0.3em] uppercase"
          }`}
        >
          {t("scroll")}
        </span>
        <div className="w-[1px] h-12 bg-gold relative">
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gold hero-scroll-line" />
        </div>
      </a>
    </section>
  );
}
