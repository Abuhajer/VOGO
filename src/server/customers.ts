"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { Role, OrderStatus } from "@/types/db";

export type AdminCustomerSummary = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  noteCount: number;
  feedbackCount: number;
};

export type AdminCustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  itemCount: number;
  itemSummary: string;
};

export type AdminCustomerNote = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
};

export type AdminCustomerFeedback = {
  id: string;
  rating: number | null;
  comment: string;
  source: string;
  createdAt: string;
  orderNumber: string | null;
};

export type AdminCustomerDetail = AdminCustomerSummary & {
  avgOrderValue: number;
  orders: AdminCustomerOrder[];
  notes: AdminCustomerNote[];
  feedback: AdminCustomerFeedback[];
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }
  return session;
}

function computeSpent(orders: { total: number; status: string }[]) {
  return orders
    .filter((order) => order.status !== OrderStatus.CANCELLED)
    .reduce((sum, order) => sum + order.total, 0);
}

function summarizeItems(
  items: { nameEn: string; nameAr: string; quantity: number }[],
  locale: string
) {
  const names = items.map((item) => (locale === "ar" ? item.nameAr : item.nameEn));
  if (names.length === 0) return "—";
  if (names.length <= 2) return names.join(locale === "ar" ? " ، " : ", ");
  return `${names.slice(0, 2).join(locale === "ar" ? " ، " : ", ")} +${names.length - 2}`;
}

export async function getAdminCustomerSummaries(): Promise<AdminCustomerSummary[]> {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  const customers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: { total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      customerNotes: { select: { id: true } },
      feedback: { select: { id: true } },
    },
  });

  return customers.map((customer) => {
    const activeOrders = customer.orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const lastOrder = customer.orders[0]?.createdAt ?? null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      image: customer.image,
      createdAt: customer.createdAt.toISOString(),
      orderCount: activeOrders.length,
      totalSpent: computeSpent(customer.orders),
      lastOrderAt: lastOrder ? lastOrder.toISOString() : null,
      noteCount: customer.customerNotes.length,
      feedbackCount: customer.feedback.length,
    };
  });
}

export async function getAdminCustomerDetail(
  customerId: string,
  locale: string
): Promise<AdminCustomerDetail | null> {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  const customer = await prisma.user.findFirst({
    where: { id: customerId, role: Role.CUSTOMER },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      customerNotes: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      feedback: {
        include: { order: { select: { orderNumber: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) return null;

  const activeOrders = customer.orders.filter((o) => o.status !== OrderStatus.CANCELLED);
  const totalSpent = computeSpent(customer.orders);

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    image: customer.image,
    createdAt: customer.createdAt.toISOString(),
    orderCount: activeOrders.length,
    totalSpent,
    lastOrderAt: customer.orders[0]?.createdAt.toISOString() ?? null,
    noteCount: customer.customerNotes.length,
    feedbackCount: customer.feedback.length,
    avgOrderValue: activeOrders.length > 0 ? Math.round(totalSpent / activeOrders.length) : 0,
    orders: customer.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      itemSummary: summarizeItems(order.items, locale),
    })),
    notes: customer.customerNotes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      authorName: note.author.name ?? note.author.email ?? "Admin",
    })),
    feedback: customer.feedback.map((entry) => ({
      id: entry.id,
      rating: entry.rating,
      comment: entry.comment,
      source: entry.source,
      createdAt: entry.createdAt.toISOString(),
      orderNumber: entry.order?.orderNumber ?? null,
    })),
  };
}

const noteSchema = z.object({
  customerId: z.string().min(1),
  content: z.string().min(2).max(2000),
});

const feedbackSchema = z.object({
  customerId: z.string().min(1),
  comment: z.string().min(2).max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  orderId: z.string().nullable().optional(),
  source: z.enum(["admin", "whatsapp", "in_store", "checkout"]).default("admin"),
});

export async function addCustomerNote(input: z.infer<typeof noteSchema>) {
  const session = await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  const data = noteSchema.parse(input);

  const note = await prisma.customerNote.create({
    data: {
      userId: data.customerId,
      authorId: session.user.id,
      content: data.content.trim(),
    },
    include: { author: { select: { name: true, email: true } } },
  });

  revalidatePath("/[locale]/admin/customers", "page");

  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    authorName: note.author.name ?? note.author.email ?? "Admin",
  } satisfies AdminCustomerNote;
}

export async function addCustomerFeedback(input: z.infer<typeof feedbackSchema>) {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database is not configured.");

  const data = feedbackSchema.parse(input);

  const entry = await prisma.customerFeedback.create({
    data: {
      userId: data.customerId,
      orderId: data.orderId ?? null,
      rating: data.rating ?? null,
      comment: data.comment.trim(),
      source: data.source,
    },
    include: { order: { select: { orderNumber: true } } },
  });

  revalidatePath("/[locale]/admin/customers", "page");

  return {
    id: entry.id,
    rating: entry.rating,
    comment: entry.comment,
    source: entry.source,
    createdAt: entry.createdAt.toISOString(),
    orderNumber: entry.order?.orderNumber ?? null,
  } satisfies AdminCustomerFeedback;
}

/** @deprecated Use getAdminCustomerSummaries from @/server/customers */
export async function getAdminCustomers() {
  return getAdminCustomerSummaries();
}
