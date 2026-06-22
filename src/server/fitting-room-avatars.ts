"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPrisma, isDatabaseConfigured, prisma } from "@/lib/db";
import {
  staticAvatarsToItems,
  type FittingRoomAvatarItem,
} from "@/lib/fitting-room/avatars";
import { Role } from "@/types/db";

const avatarSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug_format"),
  labelEn: z.string().min(2).max(120),
  labelAr: z.string().min(2).max(120),
  imageSrc: z
    .string()
    .min(2)
    .max(500_000)
    .refine(
      (value) => value.startsWith("/fitting-room/avatars/") || value.startsWith("data:image/"),
      "image_format"
    ),
  sortOrder: z.number().int().min(0).max(9999),
  active: z.boolean(),
});

export type AvatarFormInput = z.infer<typeof avatarSchema>;

export type AdminAvatar = AvatarFormInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AvatarActionResult =
  | { ok: true; avatar: AdminAvatar }
  | { ok: false; error: "unauthorized" | "validation" | "duplicate" | "not_found" | "unknown" };

function mapRowToItem(row: {
  id: string;
  imageSrc: string;
  labelEn: string;
  labelAr: string;
}): FittingRoomAvatarItem {
  return {
    id: row.id,
    src: row.imageSrc,
    labelEn: row.labelEn,
    labelAr: row.labelAr,
  };
}

function logDbFallback(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[fitting-room-avatars] ${context}: database unavailable — using static avatars (${message})`);
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session;
}

function revalidateAvatarPages() {
  for (const locale of ["ar", "en"]) {
    revalidatePath(`/${locale}/fitting-room`);
    revalidatePath(`/${locale}/admin/avatars`);
  }
}

export async function listActiveAvatars(): Promise<FittingRoomAvatarItem[]> {
  if (!isDatabaseConfigured()) {
    return staticAvatarsToItems();
  }

  try {
    const client = getPrisma();
    if (!client) return staticAvatarsToItems();

    const rows = await client.fittingRoomAvatar.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (rows.length === 0) return staticAvatarsToItems();
    return rows.map(mapRowToItem);
  } catch (err) {
    logDbFallback("listActiveAvatars", err);
    return staticAvatarsToItems();
  }
}

export async function getAdminAvatars(): Promise<AdminAvatar[]> {
  if (!(await requireAdmin())) return [];

  return prisma.fittingRoomAvatar.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  }) as Promise<AdminAvatar[]>;
}

export async function upsertAvatar(
  input: AvatarFormInput & { id?: string }
): Promise<AvatarActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const parsed = avatarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  const data = parsed.data;

  try {
    if (input.id) {
      const existing = await prisma.fittingRoomAvatar.findUnique({ where: { id: input.id } });
      if (!existing) return { ok: false, error: "not_found" };

      const avatar = await prisma.fittingRoomAvatar.update({
        where: { id: input.id },
        data,
      });

      revalidateAvatarPages();
      return { ok: true, avatar: avatar as AdminAvatar };
    }

    const avatar = await prisma.fittingRoomAvatar.create({ data });
    revalidateAvatarPages();
    return { ok: true, avatar: avatar as AdminAvatar };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "duplicate" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function setAvatarActive(id: string, active: boolean): Promise<AvatarActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  try {
    const avatar = await prisma.fittingRoomAvatar.update({
      where: { id },
      data: { active },
    });

    revalidateAvatarPages();
    return { ok: true, avatar: avatar as AdminAvatar };
  } catch {
    return { ok: false, error: "not_found" };
  }
}

export async function deleteAvatar(id: string): Promise<AvatarActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  try {
    const avatar = await prisma.fittingRoomAvatar.delete({ where: { id } });
    revalidateAvatarPages();
    return { ok: true, avatar: avatar as AdminAvatar };
  } catch {
    return { ok: false, error: "not_found" };
  }
}

export async function reorderAvatar(id: string, direction: "up" | "down"): Promise<AvatarActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const rows = await prisma.fittingRoomAvatar.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: false, error: "not_found" };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= rows.length) {
    return { ok: true, avatar: rows[index] as AdminAvatar };
  }

  const current = rows[index];
  const neighbor = rows[swapIndex];

  try {
    await prisma.$transaction([
      prisma.fittingRoomAvatar.update({
        where: { id: current.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      prisma.fittingRoomAvatar.update({
        where: { id: neighbor.id },
        data: { sortOrder: current.sortOrder },
      }),
    ]);

    const avatar = await prisma.fittingRoomAvatar.findUnique({ where: { id } });
    if (!avatar) return { ok: false, error: "not_found" };

    revalidateAvatarPages();
    return { ok: true, avatar: avatar as AdminAvatar };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
