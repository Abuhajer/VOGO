"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { GlobeIcon } from "@/components/icons/Icons";

type Props = {
  className?: string;
};

export default function LocaleToggle({ className = "" }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Navbar");

  const nextLocale = locale === "ar" ? "en" : "ar";
  const targetLabel = nextLocale === "ar" ? "ع" : "EN";

  const handleToggle = () => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`nav-utility-btn nav-locale-toggle group ${className}`}
      aria-label={
        nextLocale === "ar" ? t("switchToArabic") : t("switchToEnglish")
      }
      title={nextLocale === "ar" ? "العربية" : "English"}
    >
      <GlobeIcon size={13} className="transition-transform duration-300 group-hover:scale-105" />
      <span aria-hidden className="nav-locale-badge">
        {targetLabel}
      </span>
    </button>
  );
}
