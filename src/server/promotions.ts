"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@/types/db";
import {
  DiscountType,
  PromotionScope,
  type PromotionRecord,
} from "@/types/promotions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calculatePromoCodeDiscount,
  getPromotionStatus,
  isPromotionLive,
  normalizePromoCode,
  resolveProductPricing,
} from "@/lib/pricing";
import type { ShopProduct } from "@/lib/shop/filters";

export type AdminPromotion = PromotionRecord & {
  createdAt: string;
  updatedAt: string;
  status: ReturnType<typeof getPromotionStatus>;
  collectionNameEn: string | null;
  collectionNameAr: string | null;
  targetCount: number;
};

const promotionSchema = z.object({
  nameEn: z.string().min(2).max(120),
  nameAr: z.string().min(2).max(120),
  code: z
    .string()
    .max(40)
    .nullable()
    .optional()
    .transform((value) => {
      if (!value?.trim()) return null;
      return normalizePromoCode(value);
    }),
  discountType: z.enum([DiscountType.PERCENT, DiscountType.FIXED]),
  discountValue: z.number().int().positive().max(99999),
  scope: z.enum([PromotionScope.ORDER, PromotionScope.COLLECTION, PromotionScope.PRODUCT]),
  collectionId: z.string().nullable().optional(),
  productIds: z.array(z.string()).default([]),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  active: z.boolean(),
  usageLimit: z.number().int().positive().nullable().optional(),
  minSubtotal: z.number().int().positive().nullable().optional(),
  badgeEn: z.string().max(60).nullable().optional(),
  badgeAr: z.string().max(60).nullable().optional(),
});

export type PromotionFormInput = z.infer<typeof promotionSchema>;

export type PromotionActionResult =
  | { ok: true; promotion: AdminPromotion }
  | { ok: false; error: "unauthorized" | "validation" | "duplicate" | "not_found" | "unknown" };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session;
}

function revalidatePromotionPages() {
  for (const locale of ["ar", "en"]) {
    revalidatePath(`/${locale}/shop`);
    revalidatePath(`/${locale}/cart`);
    revalidatePath(`/${locale}/checkout`);
    revalidatePath(`/${locale}/admin/promotions`);
  }
}

function parseDateInput(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapPromotion(row: {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string | null;
  discountType: string;
  discountValue: number;
  scope: string;
  collectionId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  usageLimit: number | null;
  usageCount: number;
  minSubtotal: number | null;
  badgeEn: string | null;
  badgeAr: string | null;
  createdAt: Date;
  updatedAt: Date;
  collection?: { nameEn: string; nameAr: string } | null;
  targets?: { productId: string }[];
}): AdminPromotion {
  const record: PromotionRecord = {
    id: row.id,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    code: row.code,
    discountType: row.discountType as PromotionRecord["discountType"],
    discountValue: row.discountValue,
    scope: row.scope as PromotionRecord["scope"],
    collectionId: row.collectionId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    active: row.active,
    usageLimit: row.usageLimit,
    usageCount: row.usageCount,
    minSubtotal: row.minSubtotal,
    badgeEn: row.badgeEn,
    badgeAr: row.badgeAr,
    productIds: row.targets?.map((target) => target.productId) ?? [],
  };

  return {
    ...record,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: getPromotionStatus(record),
    collectionNameEn: row.collection?.nameEn ?? null,
    collectionNameAr: row.collection?.nameAr ?? null,
    targetCount: record.productIds.length,
  };
}

export async function getPromotionRecords(): Promise<PromotionRecord[]> {
  try {
    const rows = await prisma.promotion.findMany({
      include: { targets: true },
      orderBy: [{ active: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
    });

    return rows.map((row) =>
      mapPromotion({
        ...row,
        targets: row.targets,
      })
    );
  } catch (err) {
    console.error("[promotions] getPromotionRecords failed", err);
    return [];
  }
}

export async function getAdminPromotions(): Promise<AdminPromotion[]> {
  if (!(await requireAdmin())) return [];

  try {
    const rows = await prisma.promotion.findMany({
      include: {
        collection: true,
        targets: true,
      },
      orderBy: [{ active: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
    });

    return rows.map(mapPromotion);
  } catch (err) {
    console.error("[promotions] getAdminPromotions failed", err);
    throw new Error("PROMOTIONS_UNAVAILABLE");
  }
}

export async function upsertPromotion(
  input: PromotionFormInput & { id?: string }
): Promise<PromotionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  const data = parsed.data;

  if (data.discountType === DiscountType.PERCENT && data.discountValue > 100) {
    return { ok: false, error: "validation" };
  }

  if (data.scope === PromotionScope.COLLECTION && !data.collectionId) {
    return { ok: false, error: "validation" };
  }

  if (data.scope === PromotionScope.PRODUCT && data.productIds.length === 0) {
    return { ok: false, error: "validation" };
  }

  if (data.code && data.scope === PromotionScope.ORDER && data.productIds.length > 0) {
    return { ok: false, error: "validation" };
  }

  const startsAt = parseDateInput(data.startsAt);
  const endsAt = parseDateInput(data.endsAt);

  const payload = {
    nameEn: data.nameEn.trim(),
    nameAr: data.nameAr.trim(),
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue,
    scope: data.scope,
    collectionId: data.scope === PromotionScope.COLLECTION ? data.collectionId : null,
    startsAt,
    endsAt,
    active: data.active,
    usageLimit: data.code ? (data.usageLimit ?? null) : null,
    minSubtotal: data.minSubtotal ?? null,
    badgeEn: data.badgeEn?.trim() || null,
    badgeAr: data.badgeAr?.trim() || null,
  };

  try {
    if (input.id) {
      await prisma.promotionProduct.deleteMany({ where: { promotionId: input.id } });
      const promotion = await prisma.promotion.update({
        where: { id: input.id },
        data: {
          ...payload,
          targets:
            data.scope === PromotionScope.PRODUCT
              ? {
                  create: data.productIds.map((productId) => ({ productId })),
                }
              : undefined,
        },
        include: { collection: true, targets: true },
      });
      revalidatePromotionPages();
      return { ok: true, promotion: mapPromotion(promotion) };
    }

    const promotion = await prisma.promotion.create({
      data: {
        ...payload,
        targets:
          data.scope === PromotionScope.PRODUCT
            ? {
                create: data.productIds.map((productId) => ({ productId })),
              }
            : undefined,
      },
      include: { collection: true, targets: true },
    });
    revalidatePromotionPages();
    return { ok: true, promotion: mapPromotion(promotion) };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "duplicate" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function setPromotionActive(
  id: string,
  active: boolean
): Promise<PromotionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  try {
    const promotion = await prisma.promotion.update({
      where: { id },
      data: { active },
      include: { collection: true, targets: true },
    });
    revalidatePromotionPages();
    return { ok: true, promotion: mapPromotion(promotion) };
  } catch {
    return { ok: false, error: "not_found" };
  }
}

export async function deletePromotion(id: string): Promise<PromotionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  try {
    const promotion = await prisma.promotion.delete({
      where: { id },
      include: { collection: true, targets: true },
    });
    revalidatePromotionPages();
    return { ok: true, promotion: mapPromotion(promotion) };
  } catch {
    return { ok: false, error: "not_found" };
  }
}

export async function enrichFittingRoomProducts<T extends {
  id: string;
  price: number;
  collectionId?: string | null;
}>(
  products: T[]
): Promise<Array<T & { salePrice?: number; saleBadgeEn?: string; saleBadgeAr?: string }>> {
  const promotions = await getPromotionRecords();
  return products.map((product) => {
    const pricing = resolveProductPricing(
      {
        id: product.id,
        price: product.price,
        collectionId: product.collectionId ?? null,
      },
      promotions
    );

    if (!pricing.onSale) return product;

    return {
      ...product,
      salePrice: pricing.salePrice,
      saleBadgeEn: pricing.badgeEn ?? undefined,
      saleBadgeAr: pricing.badgeAr ?? undefined,
    };
  });
}

export async function enrichShopProducts<T extends ShopProduct>(
  products: T[]
): Promise<Array<T & { salePrice?: number; saleBadgeEn?: string; saleBadgeAr?: string }>> {
  const promotions = await getPromotionRecords();
  return products.map((product) => {
    const pricing = resolveProductPricing(
      {
        id: product.id,
        price: product.price,
        collectionId: product.collectionId,
      },
      promotions
    );

    if (!pricing.onSale) return product;

    return {
      ...product,
      salePrice: pricing.salePrice,
      saleBadgeEn: pricing.badgeEn ?? undefined,
      saleBadgeAr: pricing.badgeAr ?? undefined,
    };
  });
}

export async function getProductSalePricing(product: {
  id: string;
  price: number;
  collectionId: string | null;
}) {
  const promotions = await getPromotionRecords();
  return resolveProductPricing(product, promotions);
}

export type PromoPreviewResult =
  | {
      ok: true;
      code: string;
      discountAmount: number;
      subtotal: number;
      total: number;
      promotionNameEn: string;
      promotionNameAr: string;
    }
  | { ok: false; error: "INVALID" | "EXPIRED" | "MIN_SUBTOTAL" | "NOT_APPLICABLE" | "LIMIT" };

export async function previewPromoCode(
  code: string,
  items: Array<{
    productId: string;
    slug: string;
    quantity: number;
  }>
): Promise<PromoPreviewResult> {
  if (!code.trim() || items.length === 0) {
    return { ok: false, error: "INVALID" };
  }

  try {
  const promotionRow = await prisma.promotion.findUnique({
    where: { code: normalizePromoCode(code) },
    include: { targets: true },
  });

  if (!promotionRow?.code) return { ok: false, error: "INVALID" };

  const promotion = mapPromotion(promotionRow);
  if (!isPromotionLive(promotion)) {
    return { ok: false, error: promotion.usageLimit != null && promotion.usageCount >= promotion.usageLimit ? "LIMIT" : "EXPIRED" };
  }

  const slugs = items.map((item) => item.slug);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, active: true },
    select: { id: true, slug: true, price: true, collectionId: true },
  });

  if (products.length !== slugs.length) return { ok: false, error: "INVALID" };

  const promotions = await getPromotionRecords();
  const lines = products.map((product) => {
    const quantity = items.find((item) => item.slug === product.slug)?.quantity ?? 1;
    const pricing = resolveProductPricing(product, promotions);
    return {
      productId: product.id,
      collectionId: product.collectionId,
      quantity,
      unitPrice: pricing.salePrice,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const discountAmount = calculatePromoCodeDiscount(promotion, lines);

  if (discountAmount <= 0) {
    if (promotion.minSubtotal != null && subtotal < promotion.minSubtotal) {
      return { ok: false, error: "MIN_SUBTOTAL" };
    }
    return { ok: false, error: "NOT_APPLICABLE" };
  }

  return {
    ok: true,
    code: promotion.code!,
    discountAmount,
    subtotal,
    total: Math.max(0, subtotal - discountAmount),
    promotionNameEn: promotion.nameEn,
    promotionNameAr: promotion.nameAr,
  };
  } catch (err) {
    console.error("[promotions] previewPromoCode failed", err);
    return { ok: false, error: "INVALID" };
  }
}

export async function resolvePromotionForCheckout(code: string | null | undefined) {
  if (!code?.trim()) return null;

  try {
  const promotionRow = await prisma.promotion.findUnique({
    where: { code: normalizePromoCode(code) },
    include: { targets: true },
  });

  if (!promotionRow?.code) return null;
  const promotion = mapPromotion(promotionRow);
  if (!isPromotionLive(promotion)) return null;
  return promotion;
  } catch (err) {
    console.error("[promotions] resolvePromotionForCheckout failed", err);
    return null;
  }
}

export async function incrementPromotionUsage(promotionId: string): Promise<boolean> {
  try {
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
    select: { usageLimit: true },
  });
  if (!promotion) return false;

  if (promotion.usageLimit != null) {
    const result = await prisma.promotion.updateMany({
      where: {
        id: promotionId,
        usageCount: { lt: promotion.usageLimit },
      },
      data: { usageCount: { increment: 1 } },
    });
    return result.count > 0;
  }

  await prisma.promotion.update({
    where: { id: promotionId },
    data: { usageCount: { increment: 1 } },
  });
  return true;
  } catch (err) {
    console.error("[promotions] incrementPromotionUsage failed", err);
    return false;
  }
}
