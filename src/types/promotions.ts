export const DiscountType = {
  PERCENT: "PERCENT",
  FIXED: "FIXED",
} as const;

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const PromotionScope = {
  ORDER: "ORDER",
  COLLECTION: "COLLECTION",
  PRODUCT: "PRODUCT",
} as const;

export type PromotionScope = (typeof PromotionScope)[keyof typeof PromotionScope];

export type PromotionRecord = {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string | null;
  discountType: DiscountType;
  discountValue: number;
  scope: PromotionScope;
  collectionId: string | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  active: boolean;
  usageLimit: number | null;
  usageCount: number;
  minSubtotal: number | null;
  badgeEn: string | null;
  badgeAr: string | null;
  productIds: string[];
};
