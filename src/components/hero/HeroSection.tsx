"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { siteImages } from "@/lib/images";
import { scrollToSection } from "@/lib/scroll";
import SectionLabel from "@/components/icons/SectionLabel";
import { PrimeMarkIcon } from "@/components/icons/Icons";

type HeroSectionProps = {
  introReady?: boolean;
};

export default function HeroSection({ introReady = true }: HeroSectionProps) {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  const prefersReducedMotion = useReducedMotion();

  useGSAP(() => {
    const headlineSelector = isArabic ? ".hero-headline" : ".hero-word";

    if (!introReady) {
      if (isArabic) {
        gsap.set(headlineSelector, { opacity: 0, y: 24 });
      } else {
        gsap.set(".hero-word", { y: "100%", opacity: 0 });
      }
      gsap.set(".hero-sub", { opacity: 0, y: 15 });
      gsap.set(lineRef.current, { scaleX: 0 });
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });
      return;
    }

    if (!prefersReducedMotion) {
      const tl = gsap.timeline({ delay: 0.2 });

      if (isArabic) {
        gsap.set(headlineSelector, { opacity: 0, y: 24 });
      } else {
        gsap.set(".hero-word", { y: "100%", opacity: 0 });
      }

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
        isArabic
          ? { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" }
          : {
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
      if (isArabic) {
        gsap.set(".hero-headline", { opacity: 1, y: 0 });
      } else {
        gsap.set(".hero-word", { y: 0, opacity: 1 });
      }
      gsap.set(".hero-sub", { opacity: 1, y: 0 });
      gsap.set(lineRef.current, { scaleX: 1 });
      gsap.set(ctaRef.current, { opacity: 1, y: 0 });
    }

    // 2. Parallax scroll effect
    if (!prefersReducedMotion && bgRef.current) {
      gsap.to(bgRef.current, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(textContainerRef.current, {
        yPercent: -8,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom 30%",
          scrub: true,
        },
      });
    }
  }, { scope: sectionRef, dependencies: [prefersReducedMotion, isArabic, introReady] });

  const renderHeadline = (text: string) => {
    if (isArabic) {
      return (
        <span className="hero-headline block font-serif text-gold font-normal leading-[1.5]">
          {text}
        </span>
      );
    }

    return text.split(" ").map((word, idx) => (
      <span key={idx} className="inline-block overflow-hidden me-[0.25em]">
        <span className="hero-word inline-block font-serif italic text-gold font-light">
          {word}
        </span>
      </span>
    ));
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
        className="absolute inset-0 w-full h-[120%] -top-[10%] z-0"
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
          alt="PRIME Bespoke Suit"
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute left-[10%] top-0 bottom-0 w-[1px] bg-gold-glow opacity-10 z-10 hidden md:block" />
      <div className="absolute right-[10%] top-0 bottom-0 w-[1px] bg-gold-glow opacity-10 z-10 hidden md:block" />

      {/* Hero Content */}
      <div
        ref={textContainerRef}
        className="relative z-25 container mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-8"
      >
        {/* Minimal crown indicator */}
        <span className="inline-flex items-center gap-3 text-[10px] tracking-[0.6em] uppercase text-gold font-light mb-4 hero-sub">
          <PrimeMarkIcon size={12} className="text-gold" />
          PRIME
          <PrimeMarkIcon size={12} className="text-gold" />
        </span>

        {/* Cinematic Headline */}
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-light max-w-4xl text-balance ${
            isArabic ? "leading-[1.5]" : "tracking-wide leading-[1.25]"
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
          className="hero-sub text-sm md:text-base max-w-xl text-ivory-muted font-sans leading-relaxed text-balance"
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
            className={`group relative px-8 py-3.5 overflow-hidden rounded-sm bg-gold text-[#0E0D12] font-sans text-xs font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(201,168,76,0.3)] ${
              isArabic ? "" : "uppercase tracking-[0.2em]"
            }`}
          >
            <span className="relative z-10">{t("ctaShop")}</span>
            <span className="absolute inset-0 bg-ivory scale-x-0 origin-left transition-transform duration-500 ease-fabric group-hover:scale-x-100" />
          </a>
          <a
            href="#story"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("#story");
            }}
            className={`group px-8 py-3.5 rounded-sm border border-gold-muted text-gold font-sans text-xs font-medium transition-all duration-300 hover:bg-gold/10 ${
              isArabic ? "" : "uppercase tracking-[0.2em]"
            }`}
          >
            {t("ctaStory")}
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
        <div className="w-[1px] h-12 bg-gold-glow relative overflow-hidden">
          {/* Scrolling line animation */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 bg-gold"
            style={{
              animation: "scrollDown 2.2s infinite ease-in-out",
            }}
          />
        </div>
      </a>

      {/* CSS Animation for Scroll Line */}
      <style jsx global>{`
        @keyframes scrollDown {
          0% {
            transform: translateY(-100%);
          }
          50% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(200%);
          }
        }
      `}</style>
    </section>
  );
}
