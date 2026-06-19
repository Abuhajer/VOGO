"use client";

import { useTranslations, useLocale } from "next-intl";
import { getGoogleMapsEmbedUrl, getGoogleMapsLink } from "@/lib/location";

export default function ContactMap() {
  const t = useTranslations("Contact");
  const locale = useLocale();

  return (
    <div className="w-full max-w-xs pt-1">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[8px] uppercase tracking-[0.2em] text-ivory-faint font-sans">
          {t("mapLabel")}
        </p>
        <a
          href={getGoogleMapsLink(locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] uppercase tracking-wider text-gold hover:text-ivory transition-colors duration-300 font-sans shrink-0"
        >
          {t("openInMaps")}
        </a>
      </div>

      <div className="relative h-28 w-full overflow-hidden rounded-sm border border-gold-glow/15 bg-obsidian sm:h-32">
        <iframe
          title={t("mapTitle")}
          src={getGoogleMapsEmbedUrl(locale)}
          className="absolute inset-0 h-full w-full border-0 light:opacity-95"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold-glow/10"
          aria-hidden
        />
      </div>
    </div>
  );
}
