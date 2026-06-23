"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { siteImages } from "@/lib/images";
import { formatNumber } from "@/lib/format";
import SectionHeading from "@/components/ui/SectionHeading";
import { PrimeMarkIcon } from "@/components/icons/Icons";

export default function StorySection() {
  const t = useTranslations("Story");
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const counterContainerRef = useRef<HTMLDivElement>(null);
  const endCapRef = useRef<HTMLDivElement>(null);
  
  const prefersReducedMotion = useReducedMotion();

  useGSAP(() => {
    if (prefersReducedMotion) return;

    // 1. Zoom/reveal image on scroll enter (wrapper only — never tween Next/Image directly)
    gsap.fromTo(
      ".story-image-wrap",
      { scaleX: 1.15, scaleY: 1.15, opacity: 0.8 },
      {
        scaleX: 1.05,
        scaleY: 1.05,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: imageContainerRef.current,
          start: "top 80%",
          end: "bottom 20%",
          scrub: true,
        },
      }
    );

    // 2. Line-by-line scrollytelling (scrub per paragraph)
    gsap.utils.toArray<HTMLElement>(".story-p").forEach((paragraph) => {
      gsap.fromTo(
        paragraph,
        { y: 36, opacity: 0, filter: "blur(3px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: paragraph,
            start: "top 88%",
            end: "top 58%",
            scrub: 0.45,
          },
        }
      );
    });

    // Pin editorial image while story text scrolls (desktop)
    ScrollTrigger.matchMedia({
      "(min-width: 1024px)": () => {
        const pin = ScrollTrigger.create({
          trigger: imageContainerRef.current,
          start: "top 96px",
          endTrigger: ".story-text-col",
          end: "bottom bottom",
          pin: imageContainerRef.current,
          pinSpacing: false,
        });

        return () => pin.kill();
      },
    });

    // 3. CountUp animation for stats
    const stats = [
      { id: "stat1", target: 500, prefix: "+" },
      { id: "stat2", target: 5, prefix: "+" },
      { id: "stat3", target: 100, suffix: "%" },
    ];

    stats.forEach((stat) => {
      const el = document.getElementById(stat.id);
      if (!el) return;

      const obj = { val: 0 };
      gsap.to(obj, {
        val: stat.target,
        duration: 2.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: counterContainerRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          const numberValue = Math.round(obj.val);
          const formattedNumber = formatNumber(numberValue, locale);
          el.innerText = `${stat.prefix || ""}${formattedNumber}${stat.suffix || ""}`;
        },
      });
    });

    // 4. Parallax end-cap fabric close-up
    gsap.fromTo(
      ".endcap-bg",
      { yPercent: -15 },
      {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: endCapRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }, { scope: sectionRef, dependencies: [locale, prefersReducedMotion] });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-void pt-20 md:pt-32"
      id="story"
    >
      {/* Container holding layout */}
      <div 
        className="container mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Sticky Editorial Column (Left on LTR, Right on RTL) */}
        <div className="lg:col-span-5 flex flex-col justify-start h-fit">
          <div
            ref={imageContainerRef}
            className="relative aspect-[3/4] w-full overflow-hidden bg-obsidian border border-gold-glow/10 rounded-sm"
          >
            {/* Overlay border details */}
            <div className="absolute inset-4 border border-gold/15 z-10 pointer-events-none" />
            
            <div className="story-image-wrap absolute inset-0 overflow-hidden">
              <Image
                src={siteImages.story}
                alt="Bespoke Tailoring Craft"
                fill
                quality={92}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-ivory-faint mt-3 text-center lg:text-start">
            <PrimeMarkIcon size={10} className="text-gold shrink-0" />
            {locale === "ar" ? "تفاصيل التفصيل والمقاسات — عمان، الأردن" : "Measuring Details & Drape Craft — Amman, Jordan"}
          </span>
        </div>

        {/* Text Scrolling Column (Right on LTR, Left on RTL) */}
        <div className="story-text-col lg:col-span-7 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-8">
            <SectionHeading label={t("title")} title={t("subtitle")} />
          </div>

          {/* Copy block */}
          <div className="space-y-6 text-sm md:text-base text-ivory-muted font-sans font-light leading-relaxed max-w-xl text-balance">
            <p className="story-p">{t("p1")}</p>
            <p className="story-p">{t("p2")}</p>
            <p className="story-p">{t("p3")}</p>
          </div>

          {/* Animated Statistics Counters */}
          <div
            ref={counterContainerRef}
            className="grid grid-cols-3 gap-4 border-t border-gold-glow/20 mt-12 pt-8 max-w-xl"
          >
            <div>
              <div
                id="stat1"
                className="text-2xl md:text-4xl font-serif italic text-gold font-light mb-1"
              >
                {t("stat1")}
              </div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-ivory-faint font-sans">
                {t("label1")}
              </div>
            </div>
            <div>
              <div
                id="stat2"
                className="text-2xl md:text-4xl font-serif italic text-gold font-light mb-1"
              >
                {t("stat2")}
              </div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-ivory-faint font-sans">
                {t("label2")}
              </div>
            </div>
            <div>
              <div
                id="stat3"
                className="text-2xl md:text-4xl font-serif italic text-gold font-light mb-1"
              >
                {t("stat3")}
              </div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-ivory-faint font-sans">
                {t("label3")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End-cap: Full width parallax fabric texture */}
      <div
        ref={endCapRef}
        className="relative h-[25vh] md:h-[40vh] w-full overflow-hidden mt-24 md:mt-36 border-t border-b border-gold-glow/15"
      >
        {/* Parallax Background */}
        <div className="endcap-bg absolute inset-0 w-full h-[140%] -top-[20%] z-0">
          <div className="absolute inset-0 bg-[#050508]/85 z-10 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-void z-15" />
          <div className="story-endcap-noise absolute inset-0 z-15 pointer-events-none" aria-hidden />
          <Image
            src={siteImages.fabric}
            alt="Premium Fabric Texture"
            fill
            quality={92}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        {/* Text overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4">
          <span className="inline-flex items-center gap-3 text-[10px] md:text-xs tracking-[0.6em] uppercase text-gold font-light max-w-lg leading-relaxed text-balance justify-center">
            <PrimeMarkIcon size={12} className="text-gold shrink-0" />
            {locale === "ar" ? "أرقى الأقمشة الإيطالية والإنجليزية المصنوعة خصيصاً" : "THE FINEST ENGLISH & ITALIAN WOOLS CUSTOM MADE"}
            <PrimeMarkIcon size={12} className="text-gold shrink-0" />
          </span>
        </div>
      </div>
    </section>
  );
}
