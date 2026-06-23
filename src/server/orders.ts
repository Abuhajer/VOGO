"use server";

import { OrderStatus, PaymentMethod, Role } from "@/types/db";
import { isValidOrderStatusTransition, isOrderStatusLocked } from "@/lib/order-status";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getStaticProductBySlug } from "@/lib/catalog/static-catalog";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { BUSINESS_PHONE_E164 } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { z } from "zod";
import type { CartItem } from "@/lib/cart";
import {
  buildCheckoutLines,
  calculatePromoCodeDiscount,
  distributeDiscountAcrossLines,
} from "@/lib/pricing";
import {
  getPromotionRecords,
  incrementPromotionUsage,
  resolvePromotionForCheckout,
} from "@/server/promotions";

const checkoutSchema = z.object({
  locale: z.enum(["ar", "en"]),
  customerName: z.string().min(2).max(80),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(20),
  notes: z.string().max(500).optional(),
  promoCode: z.string().max(40).optional(),
  paymentMethod: z.enum(["STRIPE", "COD"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        slug: z.string(),
        nameAr: z.string(),
        nameEn: z.string(),
        price: z.number().int().positive(),
        imageSrc: z.string(),
        quantity: z.number().int().positive(),
        sizeCode: z.string().max(20).optional(),
        sizeLabelEn: z.string().max(40).optional(),
        sizeLabelAr: z.string().max(40).optional(),
        isCustomSize: z.boolean().optional(),
        customMeasurements: z
          .object({
            chestCm: z.number(),
            waistCm: z.number(),
            jacketLengthCm: z.number(),
            sleeveCm: z.number(),
            shoulderCm: z.number(),
            heightCm: z.number(),
          })
          .optional(),
      })
    )
    .min(1),
});

type ResolvedProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  collectionId: string | null;
};

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VOGO-${stamp}-${rand}`;
}

async function resolveProductsBySlug(slugs: string[]): Promise<ResolvedProduct[] | null> {
  const uniqueSlugs = Array.from(new Set(slugs));
  const prisma = getPrisma();

  if (prisma) {
    const products = await prisma.product.findMany({
      where: { slug: { in: uniqueSlugs }, active: true },
    });
    if (products.length !== uniqueSlugs.length) return null;
    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      price: p.price,
      collectionId: p.collectionId,
    }));
  }

  const staticProducts = uniqueSlugs
    .map((slug) => getStaticProductBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (staticProducts.length !== uniqueSlugs.length) return null;

  return staticProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    price: p.price,
    collectionId: p.collectionId ?? null,
  }));
}

function buildWhatsappCheckoutUrl(
  data: z.infer<typeof checkoutSchema>,
  pricedItems: Array<{
    nameAr: string;
    nameEn: string;
    quantity: number;
    unitPrice: number;
    sizeCode?: string | null;
    sizeLabelEn?: string | null;
    sizeLabelAr?: string | null;
  }>,
  subtotal: number,
  discountAmount = 0
) {
  const total = Math.max(0, subtotal - discountAmount);
  const isAr = data.locale === "ar";
  const lines = [
    isAr ? "طلب جديد من موقع VOGO BY FAME" : "New order from VOGO BY FAME website",
    `${isAr ? "الاسم" : "Name"}: ${data.customerName}`,
    `${isAr ? "الهاتف" : "Phone"}: ${data.customerPhone}`,
    `${isAr ? "البريد" : "Email"}: ${data.customerEmail}`,
    "",
    ...pricedItems.map((item) => {
      const label = isAr ? item.nameAr : item.nameEn;
      const sizeLabel = isAr ? item.sizeLabelAr : item.sizeLabelEn;
      const sizeSuffix = sizeLabel ? ` (${sizeLabel})` : item.sizeCode ? ` (${item.sizeCode})` : "";
      return `• ${label}${sizeSuffix} × ${item.quantity} — ${item.unitPrice * item.quantity} ${isAr ? "د.أ" : "JOD"}`;
    }),
    "",
    discountAmount > 0
      ? `${isAr ? "الخصم" : "Discount"}: -${discountAmount} ${isAr ? "د.أ" : "JOD"}`
      : null,
    `${isAr ? "المجموع" : "Total"}: ${total} ${isAr ? "د.أ" : "JOD"}`,
    data.promoCode ? `${isAr ? "كود الخصم" : "Promo code"}: ${data.promoCode}` : null,
    data.notes ? `${isAr ? "ملاحظات" : "Notes"}: ${data.notes}` : "",
  ].filter(Boolean);

  const phone = BUSINESS_PHONE_E164.replace("+", "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export async function createCheckoutOrder(input: z.infer<typeof checkoutSchema>) {
  const data = checkoutSchema.parse(input);
  const session = await auth();
  const customerEmail =
    session?.user?.email?.trim().toLowerCase() ?? data.customerEmail.toLowerCase();

  if (data.paymentMethod === "STRIPE" && !isStripeEnabled()) {
    return { ok: false as const, error: "STRIPE_UNAVAILABLE" };
  }

  const slugs = data.items.map((item) => item.slug);
  const products = await resolveProductsBySlug(slugs);

  if (!products) {
    return { ok: false as const, error: "INVALID_PRODUCTS" };
  }

  const promotions = await getPromotionRecords();
  const quantityByProductId = new Map(
    data.items.map((item) => {
      const product = products.find((entry) => entry.slug === item.slug)!;
      return [product.id, item.quantity] as const;
    })
  );

  const checkoutLines = buildCheckoutLines(products, quantityByProductId, promotions);
  const subtotal = checkoutLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  let discountAmount = 0;
  let promotionId: string | null = null;
  let promoCode: string | null = null;

  if (data.promoCode?.trim()) {
    const promotion = await resolvePromotionForCheckout(data.promoCode);
    if (!promotion) {
      return { ok: false as const, error: "INVALID_PROMO" };
    }

    discountAmount = calculatePromoCodeDiscount(promotion, checkoutLines);
    if (discountAmount <= 0) {
      if (promotion.minSubtotal != null && subtotal < promotion.minSubtotal) {
        return { ok: false as const, error: "PROMO_MIN_SUBTOTAL" };
      }
      return { ok: false as const, error: "PROMO_NOT_APPLICABLE" };
    }

    promotionId = promotion.id;
    promoCode = promotion.code;
  }

  const adjustedLines = distributeDiscountAcrossLines(checkoutLines, discountAmount);
  const pricedItems = data.items.map((item) => {
    const product = products.find((entry) => entry.slug === item.slug)!;
    const line = adjustedLines.find((entry) => entry.productId === product.id)!;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice: line.unitPrice,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      sizeCode: item.sizeCode ?? null,
      sizeLabelEn: item.sizeLabelEn ?? null,
      sizeLabelAr: item.sizeLabelAr ?? null,
      customMeasurementsJson: item.customMeasurements
        ? JSON.stringify(item.customMeasurements)
        : null,
    };
  });

  const total = Math.max(0, subtotal - discountAmount);

  const prisma = getPrisma();

  if (!prisma) {
    if (data.paymentMethod === "STRIPE") {
      return { ok: false as const, error: "STRIPE_REQUIRES_DATABASE" };
    }

    return {
      ok: true as const,
      orderNumber: null,
      redirectUrl: buildWhatsappCheckoutUrl(data, pricedItems, subtotal, discountAmount),
      viaWhatsapp: true as const,
    };
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session?.user?.id,
      status: data.paymentMethod === "COD" ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
      paymentMethod: data.paymentMethod as PaymentMethod,
      subtotal,
      discountAmount,
      promoCode,
      promotionId,
      total,
      customerName: data.customerName,
      customerEmail,
      customerPhone: data.customerPhone,
      notes: data.notes,
      locale: data.locale,
      items: {
        create: pricedItems,
      },
    },
    include: { items: true },
  });

  if (data.paymentMethod === "COD" && promotionId) {
    const incremented = await incrementPromotionUsage(promotionId);
    if (!incremented) {
      await prisma.order.delete({ where: { id: order.id } });
      return { ok: false as const, error: "INVALID_PROMO" };
    }
  }

  if (data.paymentMethod === "COD") {
    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: `/${data.locale}/checkout/success?order=${order.orderNumber}`,
      viaWhatsapp: false as const,
    };
  }

  const stripe = getStripe();
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.customerEmail,
      success_url: `${SITE_URL}/${data.locale}/checkout/success?order=${order.orderNumber}`,
      cancel_url: `${SITE_URL}/${data.locale}/checkout?cancelled=1`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      line_items: pricedItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "jod",
          unit_amount: item.unitPrice * 1000,
          product_data: {
            name: data.locale === "ar" ? item.nameAr : item.nameEn,
          },
        },
      })),
    });
  } catch (err) {
    console.error("[createCheckoutOrder] Stripe session failed", err);
    await prisma.order.delete({ where: { id: order.id } });
    return { ok: false as const, error: "STRIPE_UNAVAILABLE" };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: stripeSession.id },
  });

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.orderNumber,
    redirectUrl: stripeSession.url!,
    viaWhatsapp: false as const,
  };
}

export async function getOrderByNumber(orderNumber: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  return prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new Error("Order not found");

  if (isOrderStatusLocked(existing.status)) {
    throw new Error("ORDER_STATUS_LOCKED");
  }

  if (!isValidOrderStatusTransition(existing.status, status)) {
    throw new Error("ORDER_STATUS_INVALID");
  }

  if (
    existing.paymentMethod === PaymentMethod.STRIPE &&
    existing.status === OrderStatus.PENDING &&
    status !== OrderStatus.CANCELLED
  ) {
    throw new Error("Unpaid Stripe orders cannot be advanced until payment completes.");
  }

  if (existing.paymentMethod === PaymentMethod.STRIPE && status === OrderStatus.CONFIRMED) {
    throw new Error("Stripe orders skip manual confirmation — they move to paid via card.");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function getAdminOrders() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  return prisma.order.findMany({
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
  });
}

export type CheckoutCartItem = CartItem;
