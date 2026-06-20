"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { siteImages } from "@/lib/images";
import { BRAND_LOGO } from "@/lib/brand";

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
          className="relative hidden lg:flex flex-col justify-between overflow-hidden border-e border-gold-glow/10"
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

          <div className="auth-panel-glow relative z-10 p-10 xl:p-14">
            <div className="relative w-36 h-24 xl:w-44 xl:h-28">
              <Image
                src={BRAND_LOGO.path}
                alt={BRAND_LOGO.alt}
                fill
                sizes="176px"
                className="object-contain object-start"
              />
            </div>
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
          className="flex items-center justify-center px-6 py-28 md:px-10 lg:px-14 xl:px-20"
        >
          <div className="w-full max-w-md">{children}</div>
        </motion.div>
      </div>
    </main>
  );
}
