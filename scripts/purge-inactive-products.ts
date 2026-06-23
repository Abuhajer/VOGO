import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const inactive = await prisma.product.findMany({
    where: { active: false },
    select: { id: true, slug: true, sku: true },
  });

  if (inactive.length === 0) {
    console.log("No inactive products to remove.");
    return;
  }

  const ids = inactive.map((p) => p.id);
  const orderRefs = await prisma.orderItem.count({
    where: { productId: { in: ids } },
  });

  if (orderRefs > 0) {
    console.log(
      `Skipping hard delete: ${orderRefs} order line(s) reference inactive products.`
    );
    console.log("Inactive slugs:", inactive.map((p) => p.slug).join(", "));
    process.exit(1);
  }

  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Deleted ${result.count} inactive product(s):`);
  for (const p of inactive) {
    console.log(`  - ${p.slug} (${p.sku})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
