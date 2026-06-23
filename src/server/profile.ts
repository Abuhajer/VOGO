"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .union([z.literal(""), z.string().min(7).max(20), z.null()])
    .transform((value) => (value === "" || value == null ? null : value.trim())),
  preferredLocale: z.enum(["ar", "en"]),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72),
});

export type AccountProfile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  preferredLocale: string;
  role: string;
  memberSince: string;
  hasPassword: boolean;
};

export type ProfileUpdateResult =
  | { ok: true; profile: AccountProfile }
  | { ok: false; error: "unauthorized" | "validation" | "unknown" };

export type PasswordChangeResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "validation" | "wrong_password" | "no_password" | "unknown" };

function mapUserToProfile(user: {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  preferredLocale: string;
  role: string;
  createdAt: Date;
  passwordHash: string | null;
}): AccountProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: user.image,
    preferredLocale: user.preferredLocale ?? "ar",
    role: user.role,
    memberSince: user.createdAt.toISOString(),
    hasPassword: Boolean(user.passwordHash),
  };
}

function revalidateAccountDashboard() {
  try {
    revalidatePath("/ar/dashboard", "page");
    revalidatePath("/en/dashboard", "page");
  } catch (err) {
    console.warn("[profile] revalidatePath failed", err);
  }
}

async function resolveSessionUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.id) return session.user.id;
  if (!session.user.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.trim().toLowerCase() },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const session = await auth();
  if (!session?.user) return null;

  const resolvedId = session.user.id ?? (await resolveSessionUserId());
  if (!resolvedId || resolvedId !== userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return mapUserToProfile(user);
}

export async function updateAccountProfile(
  input: z.infer<typeof profileSchema>
): Promise<ProfileUpdateResult> {
  const userId = await resolveSessionUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    console.warn("[profile] validation failed", parsed.error.flatten());
    return { ok: false, error: "validation" };
  }

  const data = parsed.data;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        preferredLocale: data.preferredLocale,
      },
    });

    revalidateAccountDashboard();

    return { ok: true, profile: mapUserToProfile(user) };
  } catch (err) {
    console.error("[profile] update failed", err);
    return { ok: false, error: "unknown" };
  }
}

export async function changeAccountPassword(
  input: z.infer<typeof passwordSchema>
): Promise<PasswordChangeResult> {
  const userId = await resolveSessionUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return { ok: false, error: "no_password" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "wrong_password" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
    });
    return { ok: true };
  } catch (err) {
    console.error("[profile] password update failed", err);
    return { ok: false, error: "unknown" };
  }
}

export async function removeAccountAvatar(): Promise<ProfileUpdateResult> {
  const userId = await resolveSessionUserId();
  if (!userId) return { ok: false, error: "unauthorized" };

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    revalidateAccountDashboard();

    return { ok: true, profile: mapUserToProfile(user) };
  } catch (err) {
    console.error("[profile] remove avatar failed", err);
    return { ok: false, error: "unknown" };
  }
}
