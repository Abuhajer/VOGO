"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { FITTING_ROOM_AVATARS } from "@/lib/fitting-room/avatars";

type Props = {
  selectedSrc: string | null;
  onSelect: (src: string) => void;
  layout?: "scroll" | "grid";
  showHeader?: boolean;
};

function AvatarCard({
  avatar,
  selected,
  label,
  onSelect,
  className = "",
}: {
  avatar: (typeof FITTING_ROOM_AVATARS)[number];
  selected: boolean;
  label: string;
  onSelect: (src: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(avatar.src)}
      className={`fitting-room-avatar-card group relative aspect-[9/16] min-h-[44px] shrink-0 snap-center overflow-hidden rounded-sm border transition-[border-color,box-shadow,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 motion-reduce:transition-none active:scale-[0.98] ${
        selected
          ? "border-gold shadow-[0_0_20px_rgba(201,168,76,0.32)] ring-2 ring-gold/45"
          : "border-gold-glow/18 hover:border-gold/45"
      } ${className}`}
      aria-label={label}
    >
      <Image
        src={avatar.src}
        alt={label}
        fill
        sizes="(max-width: 768px) 88px, 112px"
        className="object-cover object-top bg-obsidian"
      />
      {selected ? (
        <span className="absolute end-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-gold/50 bg-void/92 text-gold shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 via-void/60 to-transparent px-1.5 pb-1.5 pt-5">
        <span className="block truncate text-center text-[7px] uppercase leading-tight tracking-[0.12em] text-ivory/92 sm:text-[8px]">
          {label}
        </span>
      </div>
    </button>
  );
}

export default function AvatarPicker({
  selectedSrc,
  onSelect,
  layout = "grid",
  showHeader = true,
}: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";

  const listClassName =
    layout === "scroll"
      ? "fitting-room-avatar-scroll flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 pt-0.5 scrollbar-hide snap-x snap-mandatory"
      : "grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="space-y-2.5" dir={isAr ? "rtl" : "ltr"}>
      {showHeader ? (
        <div className="px-0.5">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gold">{t("avatarLabel")}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-ivory-muted sm:text-[11px]">
            {t("avatarHint")}
          </p>
        </div>
      ) : null}
      <div className={listClassName} role="listbox" aria-label={t("avatarLabel")}>
        {FITTING_ROOM_AVATARS.map((avatar) => {
          const selected = selectedSrc === avatar.src;
          const label = isAr ? avatar.labelAr : avatar.labelEn;
          return (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              selected={selected}
              label={label}
              onSelect={onSelect}
              className={layout === "scroll" ? "w-[4.75rem] sm:w-20" : "w-full"}
            />
          );
        })}
      </div>
    </div>
  );
}
