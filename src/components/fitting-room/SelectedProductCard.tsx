"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { localizeProduct } from "@/lib/products";
import PriceDisplay from "@/components/shop/PriceDisplay";
import type { FittingRoomProduct } from "@/lib/try-on/types";

type Props = {
  product: FittingRoomProduct;
  compact?: boolean;
};

export default function SelectedProductCard({ product, compact }: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const { name } = localizeProduct(product, locale);

  return (
    <div
      className={`rounded-sm border border-gold-glow/20 bg-surface/80 overflow-hidden ${
        compact ? "" : "shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
      }`}
    >
      <div className="relative aspect-[3/4] bg-obsidian">
        <Image
          src={product.imageSrc}
          alt={name}
          fill
          sizes="240px"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      </div>
      <div className="p-4 space-y-1">
        <p className="text-[9px] uppercase tracking-[0.25em] text-gold">{t("selectedGarment")}</p>
        <p className="font-serif text-base text-ivory leading-snug line-clamp-2">{name}</p>
        <div className="mt-0.5">
          <PriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            locale={locale}
            size="sm"
            surface="default"
          />
        </div>
      </div>
    </div>
  );
}
