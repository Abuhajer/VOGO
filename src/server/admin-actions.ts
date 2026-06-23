"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@/types/db";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateNextSkuFromList } from "@/lib/admin-products";
import { z } from "zod";

const productSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug_format"),
  sku: z.string().min(2).max(40),
  nameAr: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120),
  descAr: z.string().min(2).max(600),
  descEn: z.string().min(2).max(600),
  price: z.number().int().positive().max(999999),
  imageSrc: z
    .string()
    .min(2)
    .refine(
      (value) => value.startsWith("/") || value.startsWith("data:image/"),
      "image_format"
    )
    .refine(
      (value) => (value.startsWith("data:") ? value.length <= 500_000 : value.length <= 500),
      "image_length"
    )
    .transform((value) => (value.startsWith("/") ? value.replace(/\/+$/, "") || value : value)),
  sizeChartJson: z.string().max(8000).nullable().optional(),
  customSizeEnabled: z.boolean(),
  active: z.boolean(),
  featuredCarousel: z.boolean(),
  collectionId: z.string().min(1).nullable(),
});

export type ProductFormInput = z.infer<typeof productSchema>;

export type AdminProduct = ProductFormInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  collection: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
  } | null;
};

export type ProductActionResult =
  | { ok: true; product: AdminProduct }
  | { ok: false; error: "unauthorized" | "validation" | "duplicate" | "not_found" | "unknown" };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session;
}

function revalidateCatalogPages() {
  for (const locale of ["ar", "en"]) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/shop`);
    revalidatePath(`/${locale}/admin/products`);
  }
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  if (!(await requireAdmin())) return [];

  return prisma.product.findMany({
    include: { collection: true },
    orderBy: { updatedAt: "desc" },
  }) as Promise<AdminProduct[]>;
}

export async function getNextProductSku(): Promise<string> {
  if (!(await requireAdmin())) return "VOGO-001";

  const rows = await prisma.product.findMany({ select: { sku: true } });
  return generateNextSkuFromList(rows.map((row) => row.sku));
}

export async function upsertProduct(
  input: ProductFormInput & { id?: string }
): Promise<ProductActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    if (process.env.NODE_ENV === "development") {
      console.error("[upsertProduct] validation failed:", parsed.error.flatten());
    }
    return { ok: false, error: "validation" };
  }

  const data = parsed.data;

  try {
    if (input.id) {
      const existing = await prisma.product.findUnique({ where: { id: input.id } });
      if (!existing) return { ok: false, error: "not_found" };

      const product = await prisma.product.update({
        where: { id: input.id },
        data,
        include: { collection: true },
      });

      revalidateCatalogPages();
      revalidatePath("/ar/shop/[slug]", "page");
      revalidatePath("/en/shop/[slug]", "page");

      return { ok: true, product: product as AdminProduct };
    }

    const product = await prisma.product.create({
      data,
      include: { collection: true },
    });
    revalidateCatalogPages();
    return { ok: true, product: product as AdminProduct };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "duplicate" };
    }
    return { ok: false, error: "unknown" };
  }
}

export async function setProductActive(
  id: string,
  active: boolean
): Promise<ProductActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { active },
      include: { collection: true },
    });

    revalidateCatalogPages();
    return { ok: true, product: product as AdminProduct };
  } catch {
    return { ok: false, error: "not_found" };
  }
}

/** Soft-delete: hides the product from the shop while preserving order history. */
export async function deleteProduct(id: string): Promise<ProductActionResult> {
  return setProductActive(id, false);
}
