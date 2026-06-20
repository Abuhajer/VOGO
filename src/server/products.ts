import { prisma } from "@/lib/db";

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { active: true },
    include: { collection: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: { collection: true },
  });
}

export { localizeProduct } from "@/lib/products";
