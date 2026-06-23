"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { siteImages } from "@/lib/images";

type AuthShellProps = {
  children: ReactNode;
  mode: "login" | "register";
};

export default function AuthShell({ children, mode }: AuthShellProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion) return;

      gsap.fromTo(
        ".auth-stitch-line",
        { scaleX: 0, opacity: 0.2 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1.4,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.35,
        }
      );

      gsap.fromTo(
        ".auth-panel-glow",
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" }
      );
    },
    { scope: panelRef, dependencies: [prefersReducedMotion] }
  );

  const eyebrow = mode === "login" ? t("loginEyebrow") : t("registerEyebrow");
  const title = mode === "login" ? t("loginTitle") : t("registerTitle");
  const subtitle = mode === "login" ? t("loginSubtitle") : t("registerSubtitle");
  const quote = mode === "login" ? t("loginQuote") : t("registerQuote");

  return (
    <main
      className="surface-dark relative min-h-screen overflow-hidden bg-[#050508]"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 start-1/4 h-72 w-72 rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-gold-glow blur-[100px] opacity-40" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div
          ref={panelRef}
          className="relative hidden lg:flex flex-col justify-end overflow-hidden border-e border-gold-glow/10"
        >
          <div className="absolute inset-0">
            <Image
              src={siteImages.hero}
              alt=""
              fill
              priority
              sizes="55vw"
              className="object-cover object-[center_20%] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/55 to-[#050508]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/30 to-transparent" />
          </div>

          <div className="relative z-10 p-10 xl:p-14 space-y-8">
            <div className="space-y-4 max-w-md">
              <p
                className={`text-gold text-xs font-sans ${
                  isArabic ? "" : "tracking-[0.35em] uppercase"
                }`}
              >
                {eyebrow}
              </p>
              <blockquote className="font-serif text-2xl xl:text-3xl text-ivory leading-relaxed text-balance">
                {quote}
              </blockquote>
            </div>

            <div className="space-y-3 max-w-sm">
              {[0, 1, 2].map((line) => (
                <div
                  key={line}
                  className="auth-stitch-line h-px w-full origin-start bg-gradient-to-r from-gold/70 via-gold/25 to-transparent"
                  style={{ transform: prefersReducedMotion ? "scaleX(1)" : undefined }}
                />
              ))}
              <p className="text-xs text-ivory-muted font-sans pt-2">{t("atelierNote")}</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center px-4 py-[calc(var(--site-nav-height)+1.5rem)] sm:px-6 md:px-10 md:py-28 lg:px-14 xl:px-20"
        >
          <div className="mx-auto w-full max-w-md">
            <header className="auth-form-header mb-6 space-y-2 text-center md:mb-8 lg:text-start">
              <p
                className={`text-gold text-[11px] font-sans lg:hidden ${
                  isArabic ? "" : "tracking-[0.35em] uppercase"
                }`}
              >
                {eyebrow}
              </p>
              <h1 className="font-serif text-3xl text-ivory md:text-4xl">{title}</h1>
              <p className="text-sm leading-relaxed text-ivory-muted">{subtitle}</p>
            </header>
            {children}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
