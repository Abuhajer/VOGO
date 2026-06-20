"use server";

import { OrderStatus, PaymentMethod, Role } from "@/types/db";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { z } from "zod";
import type { CartItem } from "@/lib/cart";

const checkoutSchema = z.object({
  locale: z.enum(["ar", "en"]),
  customerName: z.string().min(2).max(80),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(20),
  notes: z.string().max(500).optional(),
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
      })
    )
    .min(1),
});

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VOGO-${stamp}-${rand}`;
}

export async function createCheckoutOrder(input: z.infer<typeof checkoutSchema>) {
  const data = checkoutSchema.parse(input);
  const session = await auth();

  if (data.paymentMethod === "STRIPE" && !isStripeEnabled()) {
    return { ok: false as const, error: "STRIPE_UNAVAILABLE" };
  }

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== data.items.length) {
    return { ok: false as const, error: "INVALID_PRODUCTS" };
  }

  const pricedItems = data.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId)!;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
    };
  });

  const subtotal = pricedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session?.user?.id,
      status: data.paymentMethod === "COD" ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
      paymentMethod: data.paymentMethod as PaymentMethod,
      subtotal,
      total: subtotal,
      customerName: data.customerName,
      customerEmail: data.customerEmail.toLowerCase(),
      customerPhone: data.customerPhone,
      notes: data.notes,
      locale: data.locale,
      items: {
        create: pricedItems,
      },
    },
    include: { items: true },
  });

  if (data.paymentMethod === "COD") {
    return {
      ok: true as const,
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: `/${data.locale}/checkout/success?order=${order.orderNumber}`,
    };
  }

  const stripe = getStripe();
  const stripeSession = await stripe.checkout.sessions.create({
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

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: stripeSession.id },
  });

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.orderNumber,
    redirectUrl: stripeSession.url!,
  };
}

export async function getOrderByNumber(orderNumber: string) {
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

  return prisma.order.findMany({
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminCustomers() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export type CheckoutCartItem = CartItem;
