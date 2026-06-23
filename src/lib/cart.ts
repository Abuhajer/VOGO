export type CustomSizeMeasurements = {
  chestCm: number;
  waistCm: number;
  jacketLengthCm: number;
  sleeveCm: number;
  shoulderCm: number;
  heightCm: number;
};

export type CartItem = {
  productId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  imageSrc: string;
  quantity: number;
  cartLineId?: string;
  sizeCode?: string;
  sizeLabelEn?: string;
  sizeLabelAr?: string;
  isCustomSize?: boolean;
  customMeasurements?: CustomSizeMeasurements;
};

export function resolveCartLineId(item: Pick<CartItem, "cartLineId" | "productId" | "sizeCode">) {
  return item.cartLineId ?? (item.sizeCode ? `${item.productId}:${item.sizeCode}` : item.productId);
}

export const CART_STORAGE_KEY = "vogo-cart-v1";

export function getProductName(item: Pick<CartItem, "nameAr" | "nameEn">, locale: string) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

export function calcCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
