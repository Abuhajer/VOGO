import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FITTING_ROOM_AVATARS } from "../src/lib/fitting-room/avatars";
import { serializeProductSizeChart, defaultProductSizeChart } from "../src/lib/product-sizes";
import { OrderStatus, PaymentMethod, Role } from "../src/types/db";
import { applyProductDescriptions } from "./product-descriptions";

const prisma = new PrismaClient();
const defaultSizeChartJson = serializeProductSizeChart(defaultProductSizeChart());

const collections = [
  {
    slug: "evening-formal",
    nameEn: "Evening & Formal",
    nameAr: "السهرة والرسمي",
    sortOrder: 1,
  },
  {
    slug: "wedding-groom",
    nameEn: "Wedding & Groom",
    nameAr: "الزفاف والعريس",
    sortOrder: 2,
  },
  {
    slug: "business",
    nameEn: "Business",
    nameAr: "رجال الأعمال",
    sortOrder: 3,
  },
  {
    slug: "resort-summer",
    nameEn: "Resort & Summer",
    nameAr: "المنتجعات والصيف",
    sortOrder: 4,
  },
];

const catalogProducts = applyProductDescriptions([
  {
    slug: "classic-black-tuxedo",
    sku: "VOGO-001",
    collectionSlug: "evening-formal",
    featuredCarousel: true,
    nameAr: "بدلة السهرة الكلاسيكية السوداء",
    nameEn: "Classic Black Evening Tuxedo",
    descAr: "تجسيد للأناقة الخالدة بقصة إيطالية فاخرة ولون أسود عميق.",
    descEn: "Timeless elegance with an Italian cut and deep black finish.",
    price: 280,
    imageSrc: "/images/products/classic-black-tuxedo.png",
  },
  {
    slug: "royal-navy-wedding-tuxedo",
    sku: "VOGO-002",
    collectionSlug: "wedding-groom",
    featuredCarousel: true,
    nameAr: "تكسيدو الزفاف الكحلي الملكي",
    nameEn: "Royal Navy Wedding Tuxedo",
    descAr: "تصميم مذهل بياقة شال من الحرير الأسود لإطلالة زفاف لا تُنسى.",
    descEn: "Statement wedding tuxedo with black silk shawl lapels.",
    price: 350,
    imageSrc: "/images/products/royal-navy-wedding-tuxedo.png",
  },
  {
    slug: "charcoal-double-breasted",
    sku: "VOGO-003",
    collectionSlug: "business",
    featuredCarousel: true,
    nameAr: "البدلة الرمادية المخططة المزدوجة",
    nameEn: "Charcoal Double-Breasted Pinstripe",
    descAr: "هيبة الحضور وعمق الثقة لرجال الأعمال بنسيج صوف 150s.",
    descEn: "Authoritative presence in superfine 150s wool.",
    price: 290,
    imageSrc: "/images/products/charcoal-double-breasted.png",
  },
  {
    slug: "burgundy-velvet-blazer",
    sku: "VOGO-004",
    collectionSlug: "evening-formal",
    featuredCarousel: true,
    nameAr: "سترة السهرة المخملية البرغندي",
    nameEn: "Burgundy Velvet Evening Blazer",
    descAr: "أناقة جريئة وخاطفة للأنظار مخملية الملمس للمناسبات الخاصة.",
    descEn: "Bold velvet evening blazer for special occasions.",
    price: 260,
    imageSrc: "/images/products/burgundy-velvet-blazer.png",
  },
  {
    slug: "ivory-linen-blazer",
    sku: "VOGO-005",
    collectionSlug: "resort-summer",
    featuredCarousel: true,
    nameAr: "سترة الكتان العاجية الفاخرة",
    nameEn: "Ivory Luxury Linen Blazer",
    descAr: "قصة خفيفة وراقية لراحة صيفية مع لمسة الفخامة المتوسطية.",
    descEn: "Light refined cut for Mediterranean summer luxury.",
    price: 180,
    imageSrc: "/images/products/ivory-linen-blazer.png",
  },
]);

const products = catalogProducts;

const customers = [
  {
    email: "tareq@vogobyfame.com",
    name: "Tareq Haddad",
    phone: "0791112233",
    password: "Customer123!",
  },
  {
    email: "faisal@vogobyfame.com",
    name: "Faisal Al-Jabor",
    phone: "0792223344",
    password: "Customer123!",
  },
  {
    email: "omar@vogobyfame.com",
    name: "Omar Al-Shaboul",
    phone: "0793334455",
    password: "Customer123!",
  },
];

type SeedOrder = {
  orderNumber: string;
  customerEmail: string;
  status: (typeof OrderStatus)[keyof typeof OrderStatus];
  paymentMethod: (typeof PaymentMethod)[keyof typeof PaymentMethod];
  daysAgo: number;
  locale: "ar" | "en";
  notes?: string;
  items: { slug: string; quantity: number }[];
};

const sampleOrders: SeedOrder[] = [
  {
    orderNumber: "VOGO-DEMO-001",
    customerEmail: "tareq@vogobyfame.com",
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.COD,
    daysAgo: 6,
    locale: "ar",
    items: [{ slug: "royal-navy-wedding-tuxedo", quantity: 1 }],
  },
  {
    orderNumber: "VOGO-DEMO-002",
    customerEmail: "tareq@vogobyfame.com",
    status: OrderStatus.SHIPPED,
    paymentMethod: PaymentMethod.STRIPE,
    daysAgo: 3,
    locale: "ar",
    items: [
      { slug: "classic-black-tuxedo", quantity: 1 },
      { slug: "ivory-linen-blazer", quantity: 1 },
    ],
  },
  {
    orderNumber: "VOGO-DEMO-003",
    customerEmail: "faisal@vogobyfame.com",
    status: OrderStatus.PAID,
    paymentMethod: PaymentMethod.STRIPE,
    daysAgo: 2,
    locale: "en",
    items: [{ slug: "charcoal-double-breasted", quantity: 1 }],
  },
  {
    orderNumber: "VOGO-DEMO-004",
    customerEmail: "faisal@vogobyfame.com",
    status: OrderStatus.CONFIRMED,
    paymentMethod: PaymentMethod.COD,
    daysAgo: 1,
    locale: "en",
    items: [{ slug: "burgundy-velvet-blazer", quantity: 1 }],
  },
  {
    orderNumber: "VOGO-DEMO-005",
    customerEmail: "omar@vogobyfame.com",
    status: OrderStatus.PENDING,
    paymentMethod: PaymentMethod.STRIPE,
    daysAgo: 0,
    locale: "ar",
    items: [
      { slug: "ivory-linen-blazer", quantity: 2 },
      { slug: "classic-black-tuxedo", quantity: 1 },
    ],
  },
  {
    orderNumber: "VOGO-DEMO-006",
    customerEmail: "omar@vogobyfame.com",
    status: OrderStatus.CANCELLED,
    paymentMethod: PaymentMethod.COD,
    daysAgo: 5,
    locale: "ar",
    items: [{ slug: "burgundy-velvet-blazer", quantity: 1 }],
  },
  {
    orderNumber: "VOGO-DEMO-007",
    customerEmail: "tareq@vogobyfame.com",
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.COD,
    daysAgo: 0,
    locale: "ar",
    items: [{ slug: "charcoal-double-breasted", quantity: 1 }],
  },
];

function daysAgoDate(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function main() {
  const collectionBySlug = new Map<string, string>();

  for (const collection of collections) {
    const row = await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        nameEn: collection.nameEn,
        nameAr: collection.nameAr,
        sortOrder: collection.sortOrder,
        active: true,
      },
      create: collection,
    });
    collectionBySlug.set(collection.slug, row.id);
  }

  for (const product of products) {
    const { collectionSlug, featuredCarousel, ...data } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...data,
        featuredCarousel,
        sizeChartJson: defaultSizeChartJson,
        customSizeEnabled: true,
        collectionId: collectionBySlug.get(collectionSlug) ?? null,
        active: true,
      },
      create: {
        ...data,
        featuredCarousel,
        sizeChartJson: defaultSizeChartJson,
        customSizeEnabled: true,
        collectionId: collectionBySlug.get(collectionSlug) ?? null,
        active: true,
      },
    });
  }

  const catalogSlugs = products.map((product) => product.slug);

  // Purge hidden products that are not tied to any orders.
  await prisma.product.deleteMany({
    where: { active: false, orderItems: { none: {} } },
  });

  // Drop catalog orphans; keep rows only when order history references them.
  await prisma.product.deleteMany({
    where: { slug: { notIn: catalogSlugs }, orderItems: { none: {} } },
  });
  await prisma.product.updateMany({
    where: { slug: { notIn: catalogSlugs }, orderItems: { some: {} } },
    data: { active: false, featuredCarousel: false },
  });

  const productRows = await prisma.product.findMany();
  const productBySlug = new Map(productRows.map((row) => [row.slug, row]));

  const adminEmail = "admin@vogobyfame.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "VOGO Admin",
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  const customerUsers = new Map<string, string>();

  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: { name: customer.name, phone: customer.phone },
      create: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        role: Role.CUSTOMER,
        passwordHash: await bcrypt.hash(customer.password, 12),
      },
    });
    customerUsers.set(customer.email, user.id);
  }

  for (const order of sampleOrders) {
    const userId = customerUsers.get(order.customerEmail);
    const customer = customers.find((entry) => entry.email === order.customerEmail);
    if (!userId || !customer) continue;

    const pricedItems = order.items.map((item) => {
      const product = productBySlug.get(item.slug);
      if (!product) throw new Error(`Missing product: ${item.slug}`);
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
      };
    });

    const subtotal = pricedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    await prisma.order.upsert({
      where: { orderNumber: order.orderNumber },
      update: {
        status: order.status,
        paymentMethod: order.paymentMethod,
        subtotal,
        total: subtotal,
        createdAt: daysAgoDate(order.daysAgo),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        locale: order.locale,
        notes: order.notes,
        userId,
      },
      create: {
        orderNumber: order.orderNumber,
        userId,
        status: order.status,
        paymentMethod: order.paymentMethod,
        subtotal,
        total: subtotal,
        currency: "JOD",
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        locale: order.locale,
        notes: order.notes,
        createdAt: daysAgoDate(order.daysAgo),
        items: { create: pricedItems },
      },
    });

    const saved = await prisma.order.findUnique({
      where: { orderNumber: order.orderNumber },
      include: { items: true },
    });

    if (saved && saved.items.length !== pricedItems.length) {
      await prisma.orderItem.deleteMany({ where: { orderId: saved.id } });
      await prisma.orderItem.createMany({
        data: pricedItems.map((item) => ({ ...item, orderId: saved.id })),
      });
      await prisma.order.update({
        where: { id: saved.id },
        data: { subtotal, total: subtotal },
      });
    }
  }

  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  const omarId = customerUsers.get("omar@vogobyfame.com");
  const tareqId = customerUsers.get("tareq@vogobyfame.com");

  if (adminUser && omarId) {
    const omarNotes = await prisma.customerNote.count({ where: { userId: omarId } });
    if (omarNotes === 0) {
      await prisma.customerNote.create({
        data: {
          userId: omarId,
          authorId: adminUser.id,
          content:
            "Prefers slim-fit jackets. Interested in groom collection for September wedding.",
        },
      });
    }

    const omarFeedback = await prisma.customerFeedback.count({ where: { userId: omarId } });
    if (omarFeedback === 0) {
      await prisma.customerFeedback.create({
        data: {
          userId: omarId,
          rating: 5,
          comment: "Very happy with the fitting session — requested minor sleeve adjustment.",
          source: "in_store",
        },
      });
    }
  }

  if (adminUser && tareqId) {
    const tareqFeedback = await prisma.customerFeedback.count({ where: { userId: tareqId } });
    if (tareqFeedback === 0) {
      await prisma.customerFeedback.create({
        data: {
          userId: tareqId,
          rating: 4,
          comment: "Loved the fabric quality. Asked about express tailoring for one piece.",
          source: "whatsapp",
        },
      });
    }
  }

  const promoCount = await prisma.promotion.count();
  if (promoCount === 0) {
    const weddingCollectionId = collectionBySlug.get("wedding-groom");
    const tuxedoId = productBySlug.get("classic-black-tuxedo")?.id;

    if (weddingCollectionId) {
      await prisma.promotion.create({
        data: {
          nameEn: "Wedding Season",
          nameAr: "موسم الأعراس",
          code: null,
          discountType: "PERCENT",
          discountValue: 15,
          scope: "COLLECTION",
          collectionId: weddingCollectionId,
          badgeEn: "15% OFF",
          badgeAr: "خصم 15%",
          active: true,
        },
      });
    }

    await prisma.promotion.create({
      data: {
        nameEn: "Welcome offer",
        nameAr: "عرض الترحيب",
        code: "VOGO10",
        discountType: "PERCENT",
        discountValue: 10,
        scope: "ORDER",
        usageLimit: 100,
        minSubtotal: 200,
        active: true,
      },
    });

    if (tuxedoId) {
      await prisma.promotion.create({
        data: {
          nameEn: "Black Tuxedo Spotlight",
          nameAr: "عرض البدلة السوداء",
          code: null,
          discountType: "FIXED",
          discountValue: 30,
          scope: "PRODUCT",
          badgeEn: "30 JOD OFF",
          badgeAr: "خصم 30 د.أ",
          active: true,
          targets: { create: [{ productId: tuxedoId }] },
        },
      });
    }
  }

  for (let index = 0; index < FITTING_ROOM_AVATARS.length; index++) {
    const avatar = FITTING_ROOM_AVATARS[index];
    await prisma.fittingRoomAvatar.upsert({
      where: { slug: avatar.id },
      update: {
        labelEn: avatar.labelEn,
        labelAr: avatar.labelAr,
        imageSrc: avatar.src,
        sortOrder: index + 1,
        active: true,
      },
      create: {
        slug: avatar.id,
        labelEn: avatar.labelEn,
        labelAr: avatar.labelAr,
        imageSrc: avatar.src,
        sortOrder: index + 1,
        active: true,
      },
    });
  }

  const newsletterEmails = ["newsletter@vogobyfame.com", "tareq@vogobyfame.com"];
  for (const email of newsletterEmails) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, locale: "ar" },
    });
  }

  const revenueEligible = await prisma.order.aggregate({
    where: { status: { not: OrderStatus.CANCELLED } },
    _sum: { total: true },
    _count: true,
  });

  console.log("Seed complete.");
  console.log("Admin:", adminEmail, "/", adminPassword);
  console.log("Customers:", customers.map((c) => `${c.email} / ${c.password}`).join(", "));
  console.log(
    "Orders:",
    sampleOrders.length,
    "| Revenue (excl. cancelled):",
    revenueEligible._sum.total ?? 0,
    "JOD"
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
