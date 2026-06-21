"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useTheme } from "@/context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { navigateToSection, sectionHomeHref } from "@/lib/scroll";
import { NAV_SECTIONS, STORE_LINKS } from "@/lib/navigation";
import { useCart } from "@/context/CartProvider";
import { useRafScroll } from "@/hooks/useRafScroll";
import { MoonIcon, SunIcon, CloseIcon } from "@/components/icons/Icons";
import { formatNumber } from "@/lib/format";
import { BRAND_LOGO } from "@/lib/brand";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { count: cartCount } = useCart();

  const isHome = pathname === "/" || pathname === "";

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScrolledRef = useRef(false);

  useRafScroll(() => {
    const scrolled = window.scrollY > 50;
    if (isScrolledRef.current === scrolled) return;
    isScrolledRef.current = scrolled;
    setIsScrolled(scrolled);
  });

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const sectionLinks = NAV_SECTIONS.map(({ key, href }) => ({
    label: t(key),
    href,
  }));

  const storeLinks = STORE_LINKS.map(({ key, href }) => ({
    label: t(key),
    href,
  }));

  const handleLocaleToggle = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    event.preventDefault();
    handleLinkClick();
    navigateToSection(href, { isHome, locale });
  };

  const showNavSurface = isScrolled || theme === "light";

  const sectionLinkClass = `relative shrink-0 whitespace-nowrap px-1.5 py-2 rounded-sm text-[10px] lg:text-[11px] xl:text-xs text-ivory/90 hover:text-gold transition-all duration-300 font-sans font-medium border border-transparent hover:border-gold/25 hover:bg-gold/5 light:text-ivory light:hover:bg-gold/10 ${
    locale === "ar" ? "" : "tracking-[0.06em] xl:tracking-[0.08em] uppercase"
  }`;

  const storeLinkClass = `relative shrink-0 whitespace-nowrap px-1.5 py-2 rounded-sm text-[10px] lg:text-[11px] xl:text-xs text-ivory-muted hover:text-gold transition-all duration-300 font-sans font-medium border border-transparent hover:border-gold/20 hover:bg-gold/5 light:hover:bg-gold/10 ${
    locale === "ar" ? "" : "tracking-[0.06em] xl:tracking-[0.08em] uppercase"
  }`;

  const mobileLinkClass = `text-xl text-ivory hover:text-gold transition-colors duration-300 font-sans font-medium light:text-[#0E0D12] light:hover:text-gold ${
    locale === "ar" ? "" : "tracking-[0.15em] uppercase"
  }`;

  const mobileMenuLinkClass = (href: string) =>
    `${mobileLinkClass}${
      pathname === href || (href === "/fitting-room" && pathname.startsWith("/fitting-room"))
        ? " !text-gold light:!text-gold"
        : ""
    }`;

  return (
    <>
      <a
        href={isHome ? "#hero" : `/${locale}#hero`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold focus:text-[#0E0D12] focus:text-xs focus:font-semibold focus:rounded-sm"
      >
        {locale === "ar" ? "تخطي إلى المحتوى" : "Skip to content"}
      </a>

      <header
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 select-none pt-[env(safe-area-inset-top)] ${
          showNavSurface
            ? "bg-void/88 backdrop-blur-md border-b border-gold-glow/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.3)] light:shadow-[0_4px_24px_rgba(14,13,18,0.08)] light:bg-void/92"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-2 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <Link
            href="/"
            className="relative shrink-0 w-24 sm:w-28 md:w-32 lg:w-32 xl:w-36 h-14 sm:h-16 md:h-[4.5rem] lg:h-[4.5rem] xl:h-20 transition-transform duration-300 hover:scale-[1.02]"
          >
            <Image
              src={BRAND_LOGO.path}
              alt={BRAND_LOGO.alt}
              fill
              sizes="(max-width: 768px) 112px, 144px"
              priority
              className="object-contain object-start"
            />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 flex-nowrap items-center justify-center gap-0.5 lg:flex xl:gap-1 mx-1 xl:mx-3"
            aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
          >
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={isHome ? link.href : sectionHomeHref(link.href, locale)}
                onClick={(event) => handleSectionClick(event, link.href)}
                className={sectionLinkClass}
              >
                {link.label}
              </a>
            ))}
            <span className="mx-0.5 h-4 w-px shrink-0 bg-gold/20 light:bg-gold/30 xl:mx-1" aria-hidden />
            {storeLinks.map((link) => (
              <Link key={link.href} href={link.href} className={storeLinkClass}>
                {link.label}
                {link.href === "/cart" && cartCount > 0 ? (
                  <span className="ms-1 text-gold">({formatNumber(cartCount, locale)})</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 shrink-0">
            <Link
              href="/cart"
              className="lg:hidden text-ivory-muted hover:text-gold text-xs transition-colors duration-300"
            >
              {t("cart")}
              {cartCount > 0 ? ` (${formatNumber(cartCount, locale)})` : ""}
            </Link>

            <button
              onClick={handleLocaleToggle}
              className={`text-[10px] text-gold font-semibold font-sans px-2.5 py-1 border border-gold/30 hover:border-gold hover:bg-gold/10 rounded-sm transition-all duration-300 light:border-gold/40 light:hover:bg-gold/15 ${
                locale === "ar" ? "" : "tracking-[0.15em] uppercase"
              }`}
              aria-label={locale === "ar" ? "تبديل اللغة" : "Switch language"}
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>

            <button
              onClick={toggleTheme}
              className="text-ivory-muted hover:text-gold transition-colors duration-300 text-sm focus:outline-none"
              aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
            >
              {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-4 w-6 flex-col justify-between lg:hidden focus:outline-none"
              aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`w-full h-[1.5px] bg-ivory rounded-full transition-all duration-300 ${
                  mobileMenuOpen ? "transform rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`h-[1.5px] bg-ivory rounded-full transition-all duration-300 ${
                  locale === "ar" ? "origin-right" : "origin-left"
                } ${mobileMenuOpen ? "w-0" : "w-2/3"}`}
              />
              <span
                className={`w-full h-[1.5px] bg-ivory rounded-full transition-all duration-300 ${
                  mobileMenuOpen ? "transform -rotate-45 -translate-y-1" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-void/98 p-8 backdrop-blur-lg select-none light:bg-[#FAF7F2]/98"
          >
            <div className="absolute inset-0 z-0" onClick={() => setMobileMenuOpen(false)} />
            <div className="pointer-events-none absolute h-[280px] w-[280px] rounded-full bg-gold-glow opacity-15 blur-[90px] light:opacity-[0.08]" />

            <nav
              className="relative z-10 flex flex-col items-center gap-6 text-center"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {[...sectionLinks, ...storeLinks].map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx + 0.2 }}
                >
                  {link.href.startsWith("#") ? (
                    <a
                      href={link.href}
                      onClick={(event) => handleSectionClick(event, link.href)}
                      className={mobileMenuLinkClass(link.href)}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={handleLinkClick}
                      className={mobileMenuLinkClass(link.href)}
                    >
                      {link.label}
                    </Link>
                  )}
                </motion.div>
              ))}

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="mt-8 inline-flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ivory-faint hover:text-gold transition-colors duration-300 font-sans font-bold light:text-[#4A453F]"
              >
                {locale === "ar" ? "إغلاق القائمة" : "Close Menu"}
                <CloseIcon size={12} />
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
