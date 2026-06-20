"use server";

import bcrypt from "bcryptjs";
import { Role } from "@/types/db";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(72),
});

export async function registerCustomer(input: z.infer<typeof registerSchema>) {
  const data = registerSchema.parse(input);
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "EMAIL_EXISTS" };
  }

  await prisma.user.create({
    data: {
      email,
      name: data.name,
      phone: data.phone,
      role: Role.CUSTOMER,
      passwordHash: await bcrypt.hash(data.password, 12),
    },
  });

  return { ok: true as const };
}

export async function getCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
}
