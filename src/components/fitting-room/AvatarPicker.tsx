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
            ? "grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5"
            : "grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6"
        }`}
        role="listbox"
        aria-label={t("avatarLabel")}
      >
        {FITTING_ROOM_AVATARS.map((avatar) => {
          const selected = selectedSrc === avatar.src;
          const label = isAr ? avatar.labelAr : avatar.labelEn;
          return (
            <button
              key={avatar.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(avatar.src)}
              className={`group relative aspect-[3/4] min-h-[44px] overflow-hidden rounded-sm border transition-[border-color,box-shadow,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] ${
                selected
                  ? "border-gold shadow-[0_0_18px_rgba(201,168,76,0.28)] ring-1 ring-gold/40"
                  : "border-gold-glow/15 hover:border-gold/40"
              }`}
              aria-label={label}
            >
              <Image
                src={avatar.src}
                alt={label}
                fill
                sizes={compact ? "(max-width: 640px) 28vw, 96px" : "(max-width: 640px) 80px, 120px"}
                className="object-contain object-center bg-obsidian p-0.5"
              />
              {selected ? (
                <span className="absolute end-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-gold/40 bg-void/90 text-gold">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path
                      d="M2 5.2L4.2 7.4L8 2.8"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 via-void/55 to-transparent px-1 py-1.5">
                <span className="block truncate text-center text-[7px] uppercase leading-tight tracking-wider text-ivory/90 sm:text-[8px]">
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
