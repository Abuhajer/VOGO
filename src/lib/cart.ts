export type CartItem = {
  productId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  imageSrc: string;
  quantity: number;
};

export const CART_STORAGE_KEY = "vogo-cart-v1";

export function getProductName(item: Pick<CartItem, "nameAr" | "nameEn">, locale: string) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

export function calcCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
