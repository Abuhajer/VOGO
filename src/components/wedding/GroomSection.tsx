"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { siteImages } from "@/lib/images";
import SectionLabel from "@/components/icons/SectionLabel";
import { WhatsAppIcon } from "@/components/icons/Icons";

/** Fixed values so SSR and client markup match (no Math.random hydration mismatch). */
const GROOM_BOKEH = [
  { size: 72, left: 8, delay: 0, duration: 16 },
  { size: 56, left: 72, delay: 3.2, duration: 19 },
  { size: 88, left: 38, delay: 1.5, duration: 14 },
  { size: 48, left: 55, delay: 5.8, duration: 22 },
  { size: 64, left: 22, delay: 2.4, duration: 17 },
  { size: 80, left: 85, delay: 6.5, duration: 20 },
] as const;

export default function GroomSection() {
  const t = useTranslations("Wedding");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(() => {
    if (prefersReducedMotion) return;

    // Split-wipe entrance slide
    gsap.fromTo(
      ".split-left",
      { xPercent: -100 },
      {
        xPercent: 0,
        duration: 1.4,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
      }
    );

    gsap.fromTo(
      ".split-right",
      { xPercent: 100 },
      {
        xPercent: 0,
        duration: 1.4,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
      }
    );

    // Text content reveal inside right column
    gsap.fromTo(
      ".groom-content > *",
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".split-right",
          start: "top 60%",
        },
      }
    );

    gsap.fromTo(
      ".groom-cta",
      { y: 24, opacity: 0, scale: 0.92 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "back.out(1.4)",
        scrollTrigger: {
          trigger: ".groom-cta",
          start: "top 85%",
        },
      }
    );
  }, { scope: containerRef, dependencies: [prefersReducedMotion] });

  // WhatsApp link generator
  const encodedText = encodeURIComponent(
    locale === "ar"
      ? "مرحباً، أريد حجز استشارة لبدلة العرس"
      : "Hello, I would like to book a wedding suit consultation."
  );
  const whatsappUrl = `https://wa.me/962797226984?text=${encodedText}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[90vh] md:h-screen flex flex-col md:flex-row overflow-hidden bg-void border-t border-b border-gold-glow/20"
      id="wedding"
    >
      {/* Left Half: Navy Blue & Groom Image (Slides from Left) */}
      <div className="split-left relative w-full md:w-1/2 h-[50vh] md:h-full bg-[#0A0E2A] overflow-hidden">
        {/* Navy wash gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A0E2A]/70 z-10 pointer-events-none" />
        
        {/* Next.js Optimized Image */}
        <Image
          src={siteImages.groom}
          alt="Luxury Groom Tuxedo Suit"
          fill
          quality={92}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top scale-105"
        />

        {/* Ambient Overlay Tag */}
        <div className="absolute bottom-6 left-6 z-20 flex items-center space-x-2 bg-void/80 backdrop-blur-md px-4 py-2 border border-gold-glow/20 rounded-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider text-gold font-sans font-medium">
            {locale === "ar" ? "تفصيل زفاف فاخر" : "Bespoke Groom Wear"}
          </span>
        </div>
      </div>

      {/* Right Half: Warm Ivory & Content (Slides from Right) */}
      <div className="split-right relative w-full md:w-1/2 h-auto md:h-full bg-[#F5F0E8] text-[#0E0D12] flex items-center justify-center p-8 md:p-16 lg:p-24 overflow-hidden">
        {/* Floating Bokeh gold circles in background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {GROOM_BOKEH.map((particle, i) => (
              <div
                key={i}
                className="groom-bokeh absolute rounded-full bg-gold/15 filter blur-lg"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  left: `${particle.left}%`,
                  bottom: "-100px",
                  animation: `floatUp ${particle.duration}s infinite linear`,
                  animationDelay: `${particle.delay}s`,
                }}
              />
          ))}
        </div>

        {/* Content Box */}
        <div 
          className="groom-content relative z-10 w-full max-w-md flex flex-col select-none"
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <SectionLabel className="mb-3">{t("title")}</SectionLabel>
          
          <h2 className="text-3xl lg:text-4xl font-serif italic text-[#0E0D12] font-light mb-6 leading-tight">
            {t("subtitle")}
          </h2>
          
          {/* Subtle gold line divider */}
          <div className="w-16 h-[1.5px] bg-gold-muted mb-6" />
          
          <p className="text-sm md:text-base text-ivory-muted leading-relaxed font-sans font-light mb-8 text-[#2C2925] text-balance">
            {t("description")}
          </p>
          
          {/* Direct WhatsApp Call to Action */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="groom-cta inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-gold hover:bg-gold-muted text-[#0E0D12] font-sans text-[11px] uppercase tracking-[0.2em] font-semibold rounded-sm transition-all duration-300 hover:shadow-[0_4px_20px_rgba(201,168,76,0.35)]"
          >
            <WhatsAppIcon size={18} className="shrink-0" />
            <span>{t("cta")}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
