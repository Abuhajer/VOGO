import {
  DiscountType,
  PromotionScope,
  type PromotionRecord,
} from "@/types/promotions";

export type ProductPricingInput = {
  id: string;
  price: number;
  collectionId: string | null;
};

export type ProductPricingResult = {
  basePrice: number;
  salePrice: number;
  onSale: boolean;
  badgeEn: string | null;
  badgeAr: string | null;
  promotionId: string | null;
};

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

export function isPromotionLive(promotion: PromotionRecord, now = new Date()) {
  if (!promotion.active) return false;
  if (promotion.usageLimit != null && promotion.usageCount >= promotion.usageLimit) return false;

  const startsAt = promotion.startsAt ? new Date(promotion.startsAt) : null;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;

  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
}

export function getPromotionStatus(promotion: PromotionRecord, now = new Date()) {
  if (!promotion.active) return "paused" as const;
  if (promotion.usageLimit != null && promotion.usageCount >= promotion.usageLimit) {
    return "exhausted" as const;
  }

  const startsAt = promotion.startsAt ? new Date(promotion.startsAt) : null;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;

  if (startsAt && now < startsAt) return "scheduled" as const;
  if (endsAt && now > endsAt) return "ended" as const;
  return "live" as const;
}

export function applyDiscountAmount(
  amount: number,
  discountType: DiscountType,
  discountValue: number
) {
  if (discountType === DiscountType.PERCENT) {
    return Math.max(0, Math.round(amount * (1 - discountValue / 100)));
  }
  return Math.max(0, amount - discountValue);
}

export function computeDiscountDelta(
  amount: number,
  discountType: DiscountType,
  discountValue: number
) {
  return Math.max(0, amount - applyDiscountAmount(amount, discountType, discountValue));
}

export function formatDiscountLabel(
  discountType: DiscountType,
  discountValue: number,
  locale: string
) {
  if (discountType === DiscountType.PERCENT) {
    return locale === "ar" ? `خصم ${discountValue}%` : `${discountValue}% OFF`;
  }
  const currency = locale === "ar" ? "د.أ" : "JOD";
  return locale === "ar" ? `خصم ${discountValue} ${currency}` : `${discountValue} ${currency} OFF`;
}

function promotionMatchesProduct(
  promotion: PromotionRecord,
  product: ProductPricingInput
) {
  if (promotion.scope === PromotionScope.ORDER) return false;
  if (promotion.scope === PromotionScope.COLLECTION) {
    return Boolean(product.collectionId && promotion.collectionId === product.collectionId);
  }
  return promotion.productIds.includes(product.id);
}

export function pickBestAutoSale(
  product: ProductPricingInput,
  promotions: PromotionRecord[]
): PromotionRecord | null {
  const autoSales = promotions.filter(
    (promotion) => !promotion.code && isPromotionLive(promotion) && promotionMatchesProduct(promotion, product)
  );

  if (autoSales.length === 0) return null;

  return autoSales.reduce((best, current) => {
    const bestPrice = applyDiscountAmount(product.price, best.discountType, best.discountValue);
    const currentPrice = applyDiscountAmount(
      product.price,
      current.discountType,
      current.discountValue
    );
    return currentPrice < bestPrice ? current : best;
  });
}

export function resolveProductPricing(
  product: ProductPricingInput,
  promotions: PromotionRecord[]
): ProductPricingResult {
  const best = pickBestAutoSale(product, promotions);
  if (!best) {
    return {
      basePrice: product.price,
      salePrice: product.price,
      onSale: false,
      badgeEn: null,
      badgeAr: null,
      promotionId: null,
    };
  }

  const salePrice = applyDiscountAmount(product.price, best.discountType, best.discountValue);
  return {
    basePrice: product.price,
    salePrice,
    onSale: salePrice < product.price,
    badgeEn: best.badgeEn ?? formatDiscountLabel(best.discountType, best.discountValue, "en"),
    badgeAr: best.badgeAr ?? formatDiscountLabel(best.discountType, best.discountValue, "ar"),
    promotionId: best.id,
  };
}

export type CheckoutLine = {
  productId: string;
  collectionId: string | null;
  quantity: number;
  unitPrice: number;
};

export function buildCheckoutLines(
  products: Array<{ id: string; price: number; collectionId: string | null }>,
  quantities: Map<string, number>,
  promotions: PromotionRecord[]
): CheckoutLine[] {
  return products.map((product) => {
    const pricing = resolveProductPricing(product, promotions);
    return {
      productId: product.id,
      collectionId: product.collectionId,
      quantity: quantities.get(product.id) ?? 1,
      unitPrice: pricing.salePrice,
    };
  });
}

function lineIsEligibleForPromotion(
  line: CheckoutLine,
  promotion: PromotionRecord
) {
  if (promotion.scope === PromotionScope.ORDER) return true;
  if (promotion.scope === PromotionScope.COLLECTION) {
    return Boolean(line.collectionId && promotion.collectionId === line.collectionId);
  }
  return promotion.productIds.includes(line.productId);
}

export function calculatePromoCodeDiscount(
  promotion: PromotionRecord,
  lines: CheckoutLine[]
) {
  const eligibleSubtotal = lines.reduce((sum, line) => {
    if (!lineIsEligibleForPromotion(line, promotion)) return sum;
    return sum + line.unitPrice * line.quantity;
  }, 0);

  if (eligibleSubtotal <= 0) return 0;
  if (promotion.minSubtotal != null && eligibleSubtotal < promotion.minSubtotal) return 0;

  return computeDiscountDelta(eligibleSubtotal, promotion.discountType, promotion.discountValue);
}

export function distributeDiscountAcrossLines(lines: CheckoutLine[], discountAmount: number) {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  if (discountAmount <= 0 || subtotal <= 0) {
    return lines.map((line) => ({ ...line }));
  }

  const cappedDiscount = Math.min(discountAmount, subtotal);
  let remainingDiscount = cappedDiscount;

  return lines.map((line, index) => {
    const lineTotal = line.unitPrice * line.quantity;
    const isLast = index === lines.length - 1;
    const lineDiscount = isLast
      ? remainingDiscount
      : Math.round((lineTotal / subtotal) * cappedDiscount);
    remainingDiscount -= lineDiscount;

    const adjustedLineTotal = Math.max(0, lineTotal - lineDiscount);
    const adjustedUnitPrice = Math.max(1, Math.round(adjustedLineTotal / line.quantity));
    return { ...line, unitPrice: adjustedUnitPrice };
  });
}
