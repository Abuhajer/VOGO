"use server";

import bcrypt from "bcryptjs";
import { Role } from "@/types/db";
import { getPrisma } from "@/lib/db";
import { linkGuestOrdersToUser } from "@/server/customer-orders";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(72),
  preferredLocale: z.enum(["ar", "en"]).optional(),
});

export async function registerCustomer(input: z.infer<typeof registerSchema>) {
  const data = registerSchema.parse(input);
  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false as const, error: "DATABASE_UNAVAILABLE" };
  }

  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "EMAIL_EXISTS" };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      phone: data.phone,
      role: Role.CUSTOMER,
      preferredLocale: data.preferredLocale ?? "ar",
      passwordHash: await bcrypt.hash(data.password, 12),
    },
  });

  await linkGuestOrdersToUser(user.id, email);

  return { ok: true as const };
}

// Deprecated — use getCustomerOrderDetail / getCustomerOrdersList from customer-orders.ts
export async function getCustomerOrders(userId: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;

  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
}
