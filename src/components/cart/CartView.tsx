"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartProvider";
import { formatNumber } from "@/lib/format";
import { getProductName } from "@/lib/cart";

export default function CartView() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-20" dir={locale === "ar" ? "rtl" : "ltr"}>
        <p className="text-ivory-muted mb-6">{t("empty")}</p>
        <Link href="/shop" className="px-6 py-3 bg-gold text-void rounded-sm text-sm font-semibold">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      {items.map((item) => (
        <div
          key={item.productId}
          className="flex gap-4 border border-gold-glow/15 rounded-sm p-4 bg-obsidian"
        >
          <div className="relative w-24 h-32 shrink-0 overflow-hidden rounded-sm">
            <Image src={item.imageSrc} alt={getProductName(item, locale)} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <Link href={`/shop/${item.slug}`} className="font-serif text-lg text-ivory hover:text-gold">
              {getProductName(item, locale)}
            </Link>
            <p className="text-gold mt-1">
              {formatNumber(item.price, locale)} {locale === "ar" ? "د.أ" : "JOD"}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10}
                value={item.quantity}
                onChange={(event) =>
                  updateQuantity(item.productId, Number(event.target.value))
                }
                className="w-16 bg-void border border-gold-glow/20 rounded-sm px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-xs text-ivory-faint hover:text-gold"
              >
                {t("remove")}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-gold-glow/20 pt-6">
        <span className="text-ivory">{t("subtotal")}</span>
        <span className="text-gold text-xl font-serif">
          {formatNumber(subtotal, locale)} {locale === "ar" ? "د.أ" : "JOD"}
        </span>
      </div>

      <Link
        href="/checkout"
        className="inline-flex w-full items-center justify-center min-h-[48px] bg-gold text-void font-semibold rounded-sm"
      >
        {t("checkout")}
      </Link>
    </div>
  );
}
