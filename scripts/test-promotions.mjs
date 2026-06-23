import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(typeof prisma.promotion?.findMany === "function", "Prisma client missing promotion delegate");

  const count = await prisma.promotion.count();
  console.log(`promotions in db: ${count}`);

  const rows = await prisma.promotion.findMany({
    include: { collection: true, targets: true },
    take: 5,
  });
  assert(Array.isArray(rows), "promotion.findMany should return an array");
  console.log(
    "sample promotions:",
    rows.map((row) => ({
      id: row.id,
      name: row.nameEn,
      code: row.code,
      scope: row.scope,
      active: row.active,
      targets: row.targets.length,
    }))
  );

  const codePromo = rows.find((row) => row.code) ?? (await prisma.promotion.findFirst({ where: { code: { not: null } } }));
  if (codePromo?.code) {
    const byCode = await prisma.promotion.findUnique({ where: { code: codePromo.code } });
    assert(byCode?.id === codePromo.id, "promo code lookup failed");
    console.log(`code lookup ok: ${codePromo.code}`);
  } else {
    console.warn("no code-based promotion found — run `npm run db:seed`");
  }

  const product = await prisma.product.findFirst({ where: { active: true } });
  if (product) {
    const create = await prisma.promotion.create({
      data: {
        nameEn: "Test sale",
        nameAr: "عرض اختبار",
        discountType: "PERCENT",
        discountValue: 5,
        scope: "PRODUCT",
        badgeEn: "5% OFF",
        badgeAr: "خصم 5%",
        active: true,
        targets: { create: [{ productId: product.id }] },
      },
      include: { targets: true },
    });
    await prisma.promotion.delete({ where: { id: create.id } });
    console.log("create/delete product-scoped promotion: ok");
  }

  console.log("all promotion tests passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
