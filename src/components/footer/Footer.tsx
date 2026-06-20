"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { scrollToSection } from "@/lib/scroll";
import { NAV_SECTIONS } from "@/lib/navigation";
import SocialLinks from "@/components/icons/SocialLinks";
import NewsletterSignup from "@/components/marketing/NewsletterSignup";
import { BRAND_LOGO } from "@/lib/brand";

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();
  const isArabic = locale === "ar";

  const navLinks = NAV_SECTIONS.map(({ key, href }) => ({
    label: tNav(key),
    href,
  }));

  return (
    <footer className="relative w-full bg-void pt-16 pb-8 border-t border-gold-glow/10 z-10">
      {/* Container */}
      <div
        className="container mx-auto px-6 md:px-12 flex flex-col items-center justify-center text-center"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Brand Logo (Centered) */}
        <div className="mb-8 relative w-36 h-28 md:w-40 md:h-32">
          <Image
            src={BRAND_LOGO.path}
            alt={BRAND_LOGO.alt}
            fill
            sizes="200px"
            className="object-contain"
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

        {/* Newsletter */}
        <div className="mb-8 w-full max-w-md">
          <p className="text-[10px] uppercase tracking-wider text-ivory-faint mb-3">
            {isArabic ? "اشترك في نشرتنا" : "Join our newsletter"}
          </p>
          <NewsletterSignup />
        </div>

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
