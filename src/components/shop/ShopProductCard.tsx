"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
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
  const { name, description } = localizeProduct(product, locale);

  return (
    <article className="group flex flex-col bg-obsidian border border-gold-glow/15 rounded-sm overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="relative aspect-[3/4] block overflow-hidden">
        <Image
          src={product.imageSrc}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>
      <div className="p-5 flex flex-col gap-3 flex-1" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div>
          {product.collection ? (
            <p className="text-[10px] uppercase tracking-wider text-gold mb-2">
              {localizeCollectionName(product.collection, locale)}
            </p>
          ) : null}
          <h3 className="font-serif text-xl text-ivory">{name}</h3>
          <p className="mt-2 text-sm text-ivory-muted line-clamp-2">{description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-gold font-sans">
            {formatNumber(product.price, locale)} {locale === "ar" ? "د.أ" : "JOD"}
          </span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
