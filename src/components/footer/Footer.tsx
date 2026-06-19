"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { scrollToSection } from "@/lib/scroll";
import SocialLinks from "@/components/icons/SocialLinks";

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();
  const isArabic = locale === "ar";

  const navLinks = [
    { label: tNav("collection"), href: "#collection" },
    { label: tNav("story"), href: "#story" },
    { label: tNav("wedding"), href: "#wedding" },
    { label: tNav("contact"), href: "#contact" },
  ];

  return (
    <footer className="relative w-full bg-void pt-16 pb-8 border-t border-gold-glow/10 z-10">
      {/* Container */}
      <div
        className="container mx-auto px-6 md:px-12 flex flex-col items-center justify-center text-center"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Brand Logo (Centered) */}
        <div className="mb-8 relative w-48 h-12">
          <Image
            src="/logo/prime-logo.svg"
            alt="PRIME BY VOGO"
            fill
            sizes="200px"
            className="object-contain filter brightness-100"
          />
        </div>

        {/* Navigation Links */}
        <nav className="mb-8">
          <ul className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className="text-xs tracking-[0.25em] uppercase text-ivory-muted hover:text-gold transition-colors duration-300 font-sans font-light"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social Links */}
        <SocialLinks className="mb-8" isArabic={isArabic} />

        {/* Separator line */}
        <div className="w-24 h-[1px] bg-gold-glow/20 mb-6" />

        {/* Legal Rights & Branding */}
        <div className="text-[10px] tracking-wider text-ivory-faint font-sans space-y-1">
          <p>{t("rights")}</p>
          <p>{t("legalAr")}</p>
        </div>
      </div>
    </footer>
  );
}
