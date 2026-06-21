"use server";

import { OrderStatus, PaymentMethod, Role } from "@/types/db";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getStaticProductBySlug } from "@/lib/catalog/static-catalog";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { BUSINESS_PHONE_E164 } from "@/lib/format";
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

type ResolvedProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
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
  }));
}

function buildWhatsappCheckoutUrl(
  data: z.infer<typeof checkoutSchema>,
  pricedItems: Array<{
    nameAr: string;
    nameEn: string;
    quantity: number;
    unitPrice: number;
  }>,
  subtotal: number
) {
  const isAr = data.locale === "ar";
  const lines = [
    isAr ? "طلب جديد من موقع VOGO BY FAME" : "New order from VOGO BY FAME website",
    `${isAr ? "الاسم" : "Name"}: ${data.customerName}`,
    `${isAr ? "الهاتف" : "Phone"}: ${data.customerPhone}`,
    `${isAr ? "البريد" : "Email"}: ${data.customerEmail}`,
    "",
    ...pricedItems.map((item) => {
      const label = isAr ? item.nameAr : item.nameEn;
      return `• ${label} × ${item.quantity} — ${item.unitPrice * item.quantity} ${isAr ? "د.أ" : "JOD"}`;
    }),
    "",
    `${isAr ? "المجموع" : "Total"}: ${subtotal} ${isAr ? "د.أ" : "JOD"}`,
    data.notes ? `${isAr ? "ملاحظات" : "Notes"}: ${data.notes}` : "",
  ].filter(Boolean);

  const phone = BUSINESS_PHONE_E164.replace("+", "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export async function createCheckoutOrder(input: z.infer<typeof checkoutSchema>) {
  const data = checkoutSchema.parse(input);
  const session = await auth();

  if (data.paymentMethod === "STRIPE" && !isStripeEnabled()) {
    return { ok: false as const, error: "STRIPE_UNAVAILABLE" };
  }

  const slugs = data.items.map((item) => item.slug);
  const products = await resolveProductsBySlug(slugs);

  if (!products) {
    return { ok: false as const, error: "INVALID_PRODUCTS" };
  }

  const pricedItems = data.items.map((item) => {
    const product = products.find((entry) => entry.slug === item.slug)!;
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

  const prisma = getPrisma();

  if (!prisma) {
    if (data.paymentMethod === "STRIPE") {
      return { ok: false as const, error: "STRIPE_REQUIRES_DATABASE" };
    }

    return {
      ok: true as const,
      orderNumber: null,
      redirectUrl: buildWhatsappCheckoutUrl(data, pricedItems, subtotal),
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
      viaWhatsapp: false as const,
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

export async function getAdminCustomers() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  return prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export type CheckoutCartItem = CartItem;
