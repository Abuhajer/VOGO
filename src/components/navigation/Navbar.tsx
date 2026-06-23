"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useTheme } from "@/context/ThemeProvider";
import MobileNavMenu from "@/components/navigation/MobileNavMenu";
import { navigateToSection, sectionHomeHref } from "@/lib/scroll";
import { NAV_SECTIONS, STORE_LINKS } from "@/lib/navigation";
import { useCart } from "@/context/CartProvider";
import { useRafScroll } from "@/hooks/useRafScroll";
import { BagIcon, MoonIcon, SunIcon } from "@/components/icons/Icons";
import { formatNumber } from "@/lib/format";
import BrandLogo from "@/components/brand/BrandLogo";
import UserAccountMenu from "@/components/navigation/UserAccountMenu";
import LocaleToggle from "@/components/navigation/LocaleToggle";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  const sectionLinks = NAV_SECTIONS.map(({ key, href }) => ({
    label: t(key),
    href,
  }));

  const storeLinks = STORE_LINKS.map(({ key, href }) => ({
    label: t(key),
    href,
  }));

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

  const navIconClass =
    "text-ivory-muted hover:text-gold transition-colors duration-300 focus:outline-none light:text-[#2C2824] light:hover:text-[#8A6E2F]";

  const sectionLinkClass = `relative shrink-0 whitespace-nowrap px-1 py-1.5 rounded-sm text-[9px] lg:text-[10px] text-ivory/90 hover:text-gold transition-all duration-300 font-sans font-medium border border-transparent hover:border-gold/25 hover:bg-gold/5 light:text-[#0E0D12] light:hover:text-[#8A6E2F] light:hover:bg-gold/10 ${
    locale === "ar" ? "" : "tracking-[0.05em] uppercase"
  }`;

  const storeLinkClass = `relative shrink-0 whitespace-nowrap px-1 py-1.5 rounded-sm text-[9px] lg:text-[10px] text-ivory-muted hover:text-gold transition-all duration-300 font-sans font-medium border border-transparent hover:border-gold/20 hover:bg-gold/5 light:text-[#4A453F] light:hover:text-[#8A6E2F] light:hover:bg-gold/10 ${
    locale === "ar" ? "" : "tracking-[0.05em] uppercase"
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
        className={`site-header fixed top-0 left-0 right-0 z-[60] overflow-visible transition-all duration-500 select-none pt-[env(safe-area-inset-top)] ${
          mobileMenuOpen ? "pointer-events-none" : ""
        } ${
          showNavSurface
            ? "bg-void/88 backdrop-blur-md border-b border-gold-glow/10 py-2 shadow-[0_4px_30px_rgba(0,0,0,0.3)] light:border-[#0E0D12]/10 light:shadow-[0_4px_24px_rgba(14,13,18,0.08)] light:bg-[#FAF7F2]/95"
            : "bg-transparent py-2.5"
        }`}
      >
        <div
          dir="ltr"
          className="site-header-inner relative mx-auto flex min-h-10 max-w-[96rem] items-center overflow-visible px-2.5 sm:min-h-11 sm:px-5 md:px-6 lg:min-h-12 lg:px-8 xl:px-10"
        >
          <div className="site-header-start relative z-10 flex min-w-0 flex-1 items-center justify-start gap-1 sm:gap-2">
            <Link
              href="/cart"
              className={`nav-mobile-cart relative flex h-9 w-9 shrink-0 items-center justify-center rounded-sm transition-colors duration-300 lg:hidden ${navIconClass} ${
                mobileMenuOpen ? "invisible" : ""
              }`}
              aria-label={
                cartCount > 0
                  ? `${t("cart")} (${formatNumber(cartCount, locale)})`
                  : t("cart")
              }
            >
              <BagIcon size={17} />
              {cartCount > 0 ? (
                <span className="nav-cart-count" aria-hidden>
                  {formatNumber(cartCount, locale)}
                </span>
              ) : null}
            </Link>

            <nav
              className="hidden min-w-0 flex-nowrap items-center gap-0.5 lg:flex xl:gap-1"
              dir={locale === "ar" ? "rtl" : "ltr"}
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
            </nav>
          </div>

          <Link
            href="/"
            className="site-header-logo group absolute left-1/2 top-1/2 z-20 h-9 w-[4rem] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-[1.02] sm:h-9 sm:w-16 md:h-10 md:w-[4.25rem] lg:w-[4.25rem] xl:h-11 xl:w-20"
            aria-label="VOGO BY FAME"
          >
            <BrandLogo priority className="transition-[filter] duration-300 group-hover:brightness-105 light:group-hover:drop-shadow-[0_8px_18px_rgba(179,142,54,0.18)]" />
          </Link>

          <div className="site-header-end relative z-30 flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-visible sm:gap-1.5 md:gap-2 lg:gap-2">
            <nav
              className="hidden min-w-0 flex-nowrap items-center gap-0.5 lg:flex xl:gap-1"
              dir={locale === "ar" ? "rtl" : "ltr"}
              aria-label={locale === "ar" ? "المتجر" : "Store navigation"}
            >
              {storeLinks.map((link) => (
                <Link key={link.href} href={link.href} className={storeLinkClass}>
                  {link.label}
                  {link.href === "/cart" && cartCount > 0 ? (
                    <span className="ms-1 text-gold">({formatNumber(cartCount, locale)})</span>
                  ) : null}
                </Link>
              ))}
              <span className="mx-0.5 h-3 w-px shrink-0 bg-gold/20 light:bg-gold/30" aria-hidden />
            </nav>

            <div className={`nav-mobile-utils flex items-center gap-0.5 sm:gap-1 ${mobileMenuOpen ? "invisible" : ""}`}>
              <LocaleToggle />
              <button
                onClick={toggleTheme}
                className="nav-utility-btn"
                aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
              >
                {theme === "dark" ? <SunIcon size={13} /> : <MoonIcon size={13} />}
              </button>
            </div>

            <UserAccountMenu className={`shrink-0 ${mobileMenuOpen ? "max-lg:hidden" : ""}`} />

            {!mobileMenuOpen ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="nav-mobile-menu-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-transparent text-ivory transition-colors duration-300 hover:border-gold/20 hover:bg-gold/5 light:text-[#0E0D12] lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
                aria-expanded={false}
              >
                <span className="flex h-3.5 w-5 flex-col justify-between" aria-hidden>
                  <span className="h-px w-full rounded-full bg-current" />
                  <span className={`h-px rounded-full bg-current ${locale === "ar" ? "w-2/3 self-end" : "w-2/3 self-start"}`} />
                  <span className="h-px w-full rounded-full bg-current" />
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <MobileNavMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sectionLinks={sectionLinks}
        storeLinks={storeLinks}
        isHome={isHome}
        cartCount={cartCount}
        onSectionClick={handleSectionClick}
        onLinkClick={handleLinkClick}
      />
    </>
  );
}
