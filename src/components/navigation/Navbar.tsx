"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTheme } from "@/context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { scrollToSection } from "@/lib/scroll";
import { MoonIcon, SunIcon, CloseIcon } from "@/components/icons/Icons";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll height
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t("collection"), href: "#collection" },
    { label: t("story"), href: "#story" },
    { label: t("wedding"), href: "#wedding" },
    { label: t("contact"), href: "#contact" },
  ];

  const handleLocaleToggle = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleHashClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.startsWith("#")) return;

    event.preventDefault();
    handleLinkClick();
    scrollToSection(href);
  };

  return (
    <>
      {/* Navbar Container */}
      <header
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 select-none pt-[env(safe-area-inset-top)] ${
          isScrolled
            ? "bg-void/85 backdrop-blur-md border-b border-gold-glow/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
            : "surface-dark bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between gap-3">
          {/* Logo Brand */}
          <a
            href="#hero"
            onClick={(event) => handleHashClick(event, "#hero")}
            className="relative w-28 sm:w-36 h-8 sm:h-9 transition-transform duration-300 hover:scale-[1.02]"
          >
            <Image
              src="/logo/prime-logo.svg"
              alt="PRIME BY VOGO"
              fill
              sizes="150px"
              priority
              className="object-contain filter brightness-100"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleHashClick(event, link.href)}
                className={`relative text-[11px] text-ivory-muted hover:text-gold transition-colors duration-300 font-sans font-light ${
                  locale === "ar" ? "" : "tracking-[0.2em] uppercase"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Icons (Language, Theme, Mobile Menu) */}
          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={handleLocaleToggle}
              className={`text-[10px] text-gold font-semibold font-sans px-2.5 py-1 border border-gold/30 hover:border-gold hover:bg-gold/10 rounded-sm transition-all duration-300 ${
                locale === "ar" ? "" : "tracking-[0.15em] uppercase"
              }`}
              aria-label="Switch Language"
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>

            {/* Subtle Theme Toggle (☾ / ☀) */}
            <button
              onClick={toggleTheme}
              className="text-ivory-muted hover:text-gold transition-colors duration-300 text-sm focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <SunIcon size={18} />
              ) : (
                <MoonIcon size={18} />
              )}
            </button>

            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex flex-col justify-between w-6 h-4 lg:hidden focus:outline-none"
              aria-label="Toggle Mobile Menu"
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

      {/* Full-Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="surface-dark fixed inset-0 z-30 bg-[#050508]/98 backdrop-blur-lg flex flex-col justify-center items-center p-8 select-none"
          >
            {/* Close action area on click outside links */}
            <div className="absolute inset-0 z-0" onClick={() => setMobileMenuOpen(false)} />

            {/* Decorative background logo */}
            <div className="absolute w-[300px] h-[300px] rounded-full bg-gold-glow filter blur-[80px] pointer-events-none opacity-20 z-0" />

            <nav className="relative z-10 flex flex-col items-center gap-8 text-center" dir={locale === "ar" ? "rtl" : "ltr"}>
              {/* Logo in overlay */}
              <div className="relative w-32 h-8 mb-6">
                <Image
                  src="/logo/prime-logo.svg"
                  alt="PRIME BY VOGO"
                  fill
                  sizes="120px"
                  className="object-contain"
                />
              </div>

              {navLinks.map((link, idx) => (
                <motion.a
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx + 0.2 }}
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleHashClick(event, link.href)}
                  className="text-lg tracking-[0.25em] uppercase text-ivory hover:text-gold transition-colors duration-300 font-sans font-light"
                >
                  {link.label}
                </motion.a>
              ))}

              {/* Close Label */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="mt-8 inline-flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-ivory-faint hover:text-gold transition-colors duration-300 font-sans font-bold"
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
