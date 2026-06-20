"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { FITTING_ROOM_AVATARS } from "@/lib/fitting-room/avatars";

type Props = {
  selectedSrc: string | null;
  onSelect: (src: string) => void;
  compact?: boolean;
};

export default function AvatarPicker({ selectedSrc, onSelect, compact }: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <>
          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-gold">{t("avatarLabel")}</p>
          <p className="mb-4 max-w-sm text-xs leading-relaxed text-ivory-muted">{t("avatarHint")}</p>
        </>
      ) : null}
      <div
        className={`grid ${
          compact
            ? "grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5"
            : "grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5"
        }`}
      >
        {FITTING_ROOM_AVATARS.map((avatar) => {
          const selected = selectedSrc === avatar.src;
          const label = isAr ? avatar.labelAr : avatar.labelEn;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.src)}
              className={`relative aspect-[3/4] min-h-[44px] overflow-hidden rounded-sm border transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/50 active:scale-[0.98] ${
                selected
                  ? "border-gold shadow-[0_0_16px_rgba(201,168,76,0.22)] ring-1 ring-gold/35"
                  : "border-gold-glow/15 hover:border-gold/35"
              }`}
              aria-pressed={selected}
              aria-label={label}
            >
              <Image
                src={avatar.src}
                alt={label}
                fill
                sizes={compact ? "72px" : "(max-width: 640px) 80px, 120px"}
                className="object-cover object-top"
              />
              {!compact ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 to-transparent p-1.5">
                  <span className="block text-center text-[7px] uppercase leading-tight tracking-wider text-ivory-muted">
                    {label}
                  </span>
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 to-transparent px-1 py-1">
                  <span className="block truncate text-center text-[7px] uppercase tracking-wider text-ivory/90">
                    {label}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
