"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { localizeProduct } from "@/lib/products";
import { localizeCollectionName } from "@/lib/collections";
import AddToCartButton from "@/components/shop/AddToCartButton";

type Product = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  imageSrc: string;
  collection?: { nameAr: string; nameEn: string } | null;
};

export default function ShopProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations("Shop");
  const { name } = localizeProduct(product, locale);
  const currency = locale === "ar" ? "د.أ" : "JOD";

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-gold-glow/10 bg-obsidian">
        <Link
          href={`/shop/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={name}
        >
          <Image
            src={product.imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-fabric group-hover:scale-[1.04]"
          />
        </Link>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent opacity-90"
          aria-hidden
        />

        {product.collection ? (
          <p className="absolute top-2.5 start-2.5 z-10 text-[9px] uppercase tracking-[0.18em] text-gold/90 bg-void/50 backdrop-blur-sm px-2 py-1 rounded-sm">
            {localizeCollectionName(product.collection, locale)}
          </p>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5">
          <h3 className="font-serif text-sm sm:text-[0.95rem] text-ivory leading-snug line-clamp-2">
            <Link href={`/shop/${product.slug}`} className="hover:text-gold transition-colors duration-200">
              {name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-gold font-sans tracking-wide">
            {formatNumber(product.price, locale)} {currency}
          </p>

          <div className="mt-2.5 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200">
            <AddToCartButton product={product} size="compact" className="flex-1" />
            <Link
              href={`/shop/${product.slug}`}
              className="shrink-0 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] border border-gold-glow/30 text-ivory-muted rounded-sm hover:text-gold hover:border-gold/40 transition-colors duration-200"
            >
              {t("viewPiece")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
