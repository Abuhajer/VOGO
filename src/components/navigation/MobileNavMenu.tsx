"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTheme } from "@/context/ThemeProvider";
import { sectionHomeHref } from "@/lib/scroll";
import { BagIcon, CloseIcon, GlobeIcon, MoonIcon, SunIcon } from "@/components/icons/Icons";
import { formatNumber } from "@/lib/format";
import BrandLogo from "@/components/brand/BrandLogo";
import UserAccountMenu from "@/components/navigation/UserAccountMenu";

type NavLink = {
  label: string;
  href: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sectionLinks: NavLink[];
  storeLinks: NavLink[];
  isHome: boolean;
  cartCount: number;
  onSectionClick: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onLinkClick: () => void;
};

function NavChevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-gold/45 rtl:rotate-180"
    >
      <path
        d="M6 3L11 8L6 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isLinkActive(pathname: string, href: string) {
  if (href.startsWith("#")) return false;
  return pathname === href || (href === "/fitting-room" && pathname.startsWith("/fitting-room"));
}

export default function MobileNavMenu({
  open,
  onClose,
  sectionLinks,
  storeLinks,
  isHome,
  cartCount,
  onSectionClick,
  onLinkClick,
}: Props) {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === "ar";
  const nextLocale = locale === "ar" ? "en" : "ar";
  const localeShort = nextLocale === "ar" ? "ع" : "EN";

  const handleLinkClick = () => {
    onLinkClick();
    onClose();
  };

  const linkClass = (active?: boolean) =>
    `mobile-nav-link group flex min-h-11 w-full items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-start transition-colors duration-200 ${
      active
        ? "bg-gold/10 text-gold"
        : "text-ivory/92 hover:bg-gold/[0.06] hover:text-gold light:text-[#0E0D12] light:hover:bg-gold/8"
    }`;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            key="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="mobile-nav-backdrop fixed inset-0 z-[68] bg-[#050508]/80 backdrop-blur-sm light:bg-[#0E0D12]/35 lg:hidden"
            aria-label={t("closeMenu")}
            onClick={onClose}
          />

          <motion.aside
            key="mobile-nav-drawer"
            initial={{ x: isAr ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? "-100%" : "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mobile-nav-drawer fixed inset-y-0 z-[70] flex w-[min(92vw,21.5rem)] flex-col bg-[#0A090D] shadow-[-16px_0_48px_rgba(0,0,0,0.55)] lg:hidden end-0 border-s border-gold-glow/12 light:bg-[#FAF7F2] light:shadow-[-10px_0_36px_rgba(14,13,18,0.14)]"
            dir={isAr ? "rtl" : "ltr"}
            role="dialog"
            aria-modal="true"
            aria-label={t("mobileMenu")}
          >
            {/* Header */}
            <div className="mobile-nav-drawer-header flex shrink-0 items-center justify-between gap-3 border-b border-gold-glow/10 px-4 pb-3 pt-[calc(0.65rem+env(safe-area-inset-top))] light:border-[#0E0D12]/8">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-w-0 items-center gap-2.5"
                aria-label="VOGO BY FAME"
              >
                <span className="relative h-8 w-[3.5rem] shrink-0">
                  <BrandLogo className="object-contain" />
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="mobile-nav-close flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory-muted transition-colors hover:bg-gold/10 hover:text-gold light:text-[#4A453F]"
                aria-label={t("closeMenu")}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Compact utility row */}
            <div className="mobile-nav-utils flex shrink-0 items-center justify-between gap-2 border-b border-gold-glow/10 px-4 py-2.5 light:border-[#0E0D12]/8">
              <button
                type="button"
                onClick={() => {
                  handleLinkClick();
                  router.replace(pathname, { locale: nextLocale });
                }}
                className="mobile-nav-util-btn inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-gold-glow/12 bg-void/50 px-2.5 text-[11px] font-medium text-ivory-muted transition-colors hover:border-gold/25 hover:text-gold light:bg-white/60 light:text-[#4A453F]"
                aria-label={nextLocale === "ar" ? t("switchToArabic") : t("switchToEnglish")}
              >
                <GlobeIcon size={14} />
                <span>{localeShort}</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="mobile-nav-util-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-glow/12 bg-void/50 text-ivory-muted transition-colors hover:border-gold/25 hover:text-gold light:bg-white/60 light:text-[#4A453F]"
                aria-label={isAr ? "تبديل المظهر" : "Toggle theme"}
              >
                {theme === "dark" ? <SunIcon size={14} /> : <MoonIcon size={14} />}
              </button>
              <Link
                href="/cart"
                onClick={handleLinkClick}
                className="mobile-nav-util-btn relative inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-gold-glow/12 bg-void/50 px-2.5 text-[11px] font-medium text-ivory-muted transition-colors hover:border-gold/25 hover:text-gold light:bg-white/60 light:text-[#4A453F]"
                aria-label={cartCount > 0 ? `${t("cart")} (${formatNumber(cartCount, locale)})` : t("cart")}
              >
                <BagIcon size={14} />
                <span>{t("cart")}</span>
                {cartCount > 0 ? (
                  <span className="absolute -top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[8px] font-bold text-[#0E0D12]">
                    {formatNumber(cartCount, locale)}
                  </span>
                ) : null}
              </Link>
            </div>

            {/* Scrollable nav */}
            <div className="mobile-nav-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 py-3">
              <div className="mb-4">
                <p
                  className={`mb-1.5 px-2 text-[9px] font-semibold text-gold/70 ${
                    isAr ? "" : "uppercase tracking-[0.2em]"
                  }`}
                >
                  {t("mobileExplore")}
                </p>
                <ul className="flex flex-col">
                  {sectionLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={isHome ? link.href : sectionHomeHref(link.href, locale)}
                        onClick={(event) => {
                          onSectionClick(event, link.href);
                          onClose();
                        }}
                        className={linkClass()}
                      >
                        <span className="font-sans text-[15px] font-medium leading-snug">{link.label}</span>
                        <NavChevron />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-2">
                <p
                  className={`mb-1.5 px-2 text-[9px] font-semibold text-gold/70 ${
                    isAr ? "" : "uppercase tracking-[0.2em]"
                  }`}
                >
                  {t("mobileShop")}
                </p>
                <ul className="flex flex-col">
                  {storeLinks.map((link) => {
                    const active = isLinkActive(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link href={link.href} onClick={handleLinkClick} className={linkClass(active)}>
                          <span className="flex min-w-0 items-center gap-2 font-sans text-[15px] font-medium leading-snug">
                            {link.label}
                            {link.href === "/cart" && cartCount > 0 ? (
                              <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                                {formatNumber(cartCount, locale)}
                              </span>
                            ) : null}
                          </span>
                          <NavChevron />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-auto border-t border-gold-glow/10 pt-3 light:border-[#0E0D12]/8">
                <UserAccountMenu variant="drawer" onNavigate={handleLinkClick} />
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
