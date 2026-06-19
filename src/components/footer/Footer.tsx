"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { scrollToSection } from "@/lib/scroll";
import { FacebookIcon, LinkedInIcon } from "@/components/icons/Icons";

const SOCIAL_LINK_CLASS =
  "group flex h-10 w-10 items-center justify-center rounded-full border border-gold-muted/40 bg-surface/50 text-gold transition-all duration-300 hover:border-transparent hover:text-white light:border-gold-muted/50 light:bg-surface light:text-[#4A453F] light:hover:text-white";

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
        <div className="flex gap-4 mb-8">
          <a
            href="https://www.facebook.com/vogobyfame"
            target="_blank"
            rel="noopener noreferrer"
            className={`${SOCIAL_LINK_CLASS} hover:bg-[#1877F2]`}
            aria-label={isArabic ? "فيسبوك" : "Facebook"}
          >
            <FacebookIcon size={18} className="shrink-0" />
          </a>

          <a
            href="https://www.linkedin.com/company/vogobyfame"
            target="_blank"
            rel="noopener noreferrer"
            className={`${SOCIAL_LINK_CLASS} hover:bg-[#0A66C2]`}
            aria-label={isArabic ? "لينكدإن" : "LinkedIn"}
          >
            <LinkedInIcon size={18} className="shrink-0" />
          </a>
        </div>

        {/* Separator line */}
        <div className="w-24 h-[1px] bg-gold-glow/20 mb-6" />

        {/* Legal Rights & Branding */}
        <div className="text-[10px] tracking-wider text-ivory-faint font-sans space-y-1">
          <p>{t("rights")}</p>
          <p className="opacity-70">
            {locale === "ar"
              ? "مُصمَّم للحظة التي تُعرّفك. ڤوچو — الخيار الأول للبدلات والملابس الرسمية."
              : "Dressed for the moment that defines you. Flagship digital boutique."}
          </p>
        </div>
      </div>
    </footer>
  );
}
