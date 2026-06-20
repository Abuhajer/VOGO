"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartProvider";

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
}: {
  product: Product;
  quantity?: number;
}) {
  const t = useTranslations("Shop");
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() =>
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
        )
      }
      className="px-4 py-2 bg-gold text-void text-xs font-semibold rounded-sm hover:bg-gold-muted transition-colors"
    >
      {t("addToCart")}
    </button>
  );
}
