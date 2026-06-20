"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function subscribeNewsletter(input: z.infer<typeof newsletterSchema>) {
  const data = newsletterSchema.parse(input);

  await prisma.newsletterSubscriber.upsert({
    where: { email: data.email.toLowerCase() },
    update: { locale: data.locale },
    create: { email: data.email.toLowerCase(), locale: data.locale },
  });

  if (process.env.RESEND_API_KEY) {
    // Hook for Resend — log only when not configured with full template setup.
    console.info("[newsletter] subscribed:", data.email);
  }

  return { ok: true as const };
}
