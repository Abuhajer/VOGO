"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartProvider";
import { useAppToast } from "@/hooks/useAppToast";

type Product = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  imageSrc: string;
};

export default function AddToCartButton({
  product,
  quantity = 1,
  size = "default",
  className = "",
}: {
  product: Product;
  quantity?: number;
  size?: "default" | "compact";
  className?: string;
}) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const { addItem } = useCart();
  const { cartAdded } = useAppToast();
  const productName = locale === "ar" ? product.nameAr : product.nameEn;

  const sizeClasses =
    size === "compact"
      ? "w-full px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em]"
      : "px-4 py-2 text-xs";

  return (
    <button
      type="button"
      onClick={() => {
        addItem(
          {
            productId: product.id,
            slug: product.slug,
            nameAr: product.nameAr,
            nameEn: product.nameEn,
            price: product.price,
            imageSrc: product.imageSrc,
          },
          quantity
        );
        cartAdded(productName);
      }}
      className={`${sizeClasses} ${className} bg-gold text-void font-semibold rounded-sm hover:bg-gold-muted transition-colors cursor-pointer`}
    >
      {t("addToCart")}
    </button>
  );
}
