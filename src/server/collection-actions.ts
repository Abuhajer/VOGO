"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@/types/db";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const collectionSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug_format"),
  nameAr: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120),
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
});

export type CollectionFormInput = z.infer<typeof collectionSchema>;

export type AdminCollection = CollectionFormInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
};

export type CollectionActionResult =
  | { ok: true; collection: AdminCollection }
  | { ok: false; error: "unauthorized" | "validation" | "duplicate" | "not_found" | "has_products" | "unknown" };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session;
}

function revalidateCollectionPages() {
  for (const locale of ["ar", "en"]) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/shop`);
    revalidatePath(`/${locale}/admin/products`);
    revalidatePath(`/${locale}/admin/collections`);
  }
}

function mapCollection(
  row: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
    sortOrder: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { products: number };
  }
): AdminCollection {
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    sortOrder: row.sortOrder,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    productCount: row._count.products,
  };
}

export async function getAdminCollections(): Promise<AdminCollection[]> {
  if (!(await requireAdmin())) return [];

  const prisma = getPrisma();
  if (!prisma) return [];

  const rows = await prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return rows.map(mapCollection);
}

export async function upsertCollection(
  input: CollectionFormInput & { id?: string }
): Promise<CollectionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "unknown" };

  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  const data = parsed.data;

  try {
    if (input.id) {
      const collection = await prisma.collection.update({
        where: { id: input.id },
        data,
        include: { _count: { select: { products: true } } },
      });
      revalidateCollectionPages();
      return { ok: true, collection: mapCollection(collection) };
    }

    const collection = await prisma.collection.create({
      data,
      include: { _count: { select: { products: true } } },
    });
    revalidateCollectionPages();
    return { ok: true, collection: mapCollection(collection) };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "duplicate" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function setCollectionActive(
  id: string,
  active: boolean
): Promise<CollectionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "unknown" };

  try {
    const collection = await prisma.collection.update({
      where: { id },
      data: { active },
      include: { _count: { select: { products: true } } },
    });
    revalidateCollectionPages();
    return { ok: true, collection: mapCollection(collection) };
  } catch {
    return { ok: false, error: "not_found" };
  }
}

export async function deleteCollection(id: string): Promise<CollectionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "unknown" };

  const existing = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) return { ok: false, error: "not_found" };
  if (existing._count.products > 0) return { ok: false, error: "has_products" };

  try {
    await prisma.collection.delete({ where: { id } });
    revalidateCollectionPages();
    return {
      ok: true,
      collection: mapCollection({ ...existing, _count: existing._count }),
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function moveCollection(
  id: string,
  direction: "up" | "down"
): Promise<CollectionActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const prisma = getPrisma();
  if (!prisma) return { ok: false, error: "unknown" };

  const rows = await prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: false, error: "not_found" };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= rows.length) {
    return { ok: true, collection: mapCollection(rows[index]) };
  }

  const current = rows[index];
  const neighbor = rows[swapIndex];

  await prisma.$transaction([
    prisma.collection.update({
      where: { id: current.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    prisma.collection.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  const updated = await prisma.collection.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  revalidateCollectionPages();
  return { ok: true, collection: mapCollection(updated) };
}

export async function getNextCollectionSortOrder(): Promise<number> {
  if (!(await requireAdmin())) return 1;

  const prisma = getPrisma();
  if (!prisma) return 1;

  const max = await prisma.collection.aggregate({ _max: { sortOrder: true } });
  return (max._max.sortOrder ?? 0) + 1;
}
