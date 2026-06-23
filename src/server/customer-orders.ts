"use server";

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import type { CustomerOrderDetail, DashboardOrderRow } from "@/types/dashboard";

function mapOrderRow(order: {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: unknown[];
}): DashboardOrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.length,
  };
}

function mapOrderDetail(order: {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  promoCode: string | null;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
  locale: string;
  createdAt: Date;
  items: {
    id: string;
    productId: string;
    nameAr: string;
    nameEn: string;
    quantity: number;
    unitPrice: number;
    sizeCode: string | null;
    sizeLabelEn: string | null;
    sizeLabelAr: string | null;
    customMeasurementsJson: string | null;
  }[];
}): CustomerOrderDetail {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    promoCode: order.promoCode,
    total: order.total,
    currency: order.currency,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    notes: order.notes,
    locale: order.locale,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sizeCode: item.sizeCode,
      sizeLabelEn: item.sizeLabelEn,
      sizeLabelAr: item.sizeLabelAr,
      customMeasurementsJson: item.customMeasurementsJson,
    })),
  };
}

/** Attach guest orders (same email, no userId) to a registered account. */
export async function linkGuestOrdersToUser(userId: string, email: string): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;

  const normalizedEmail = email.trim().toLowerCase();
  const result = await prisma.order.updateMany({
    where: {
      userId: null,
      customerEmail: normalizedEmail,
    },
    data: { userId },
  });

  return result.count;
}

/** Run guest-order linking for the signed-in customer (idempotent). */
export async function syncCustomerAccount(): Promise<{ linkedOrders: number }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { linkedOrders: 0 };
  }

  const linkedOrders = await linkGuestOrdersToUser(session.user.id, session.user.email);
  return { linkedOrders };
}

export async function getCustomerOrderDetail(orderId: string): Promise<CustomerOrderDetail | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prisma = getPrisma();
  if (!prisma) return null;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { userId: session.user.id },
        {
          userId: null,
          customerEmail: session.user.email!.trim().toLowerCase(),
        },
      ],
    },
    include: { items: true },
  });

  if (!order) return null;

  if (!order.userId) {
    await prisma.order.update({
      where: { id: order.id },
      data: { userId: session.user.id },
    });
  }

  return mapOrderDetail(order);
}

export async function getCustomerOrdersList(userId: string): Promise<DashboardOrderRow[]> {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const prisma = getPrisma();
  if (!prisma) return [];

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderRow);
}
