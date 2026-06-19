"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { PrimeMarkIcon } from "@/components/icons/Icons";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const locale = useLocale();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-void px-6 text-center"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <PrimeMarkIcon size={32} className="text-gold mb-6" />
      <p className="text-[10px] uppercase tracking-[0.4em] text-gold-muted mb-3">
        404
      </p>
      <h1 className="text-3xl md:text-4xl font-serif font-light text-ivory mb-4">
        {t("title")}
      </h1>
      <p className="text-sm text-ivory-muted max-w-md mb-8 leading-relaxed">
        {t("description")}
      </p>
      <Link
        href="/"
        className="px-8 py-3.5 bg-gold text-[#0E0D12] text-xs font-semibold uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_25px_rgba(201,168,76,0.3)] transition-shadow"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
