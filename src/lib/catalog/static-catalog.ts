import { applyProductDescriptions } from "../../../prisma/product-descriptions";
import type { CollectionCarouselProduct } from "@/types/catalog";
import type { FittingRoomProduct } from "@/lib/try-on/types";

export const STATIC_COLLECTIONS = [
  {
    id: "evening-formal",
    slug: "evening-formal",
    nameEn: "Evening & Formal",
    nameAr: "السهرة والرسمي",
    sortOrder: 1,
    active: true,
  },
  {
    id: "wedding-groom",
    slug: "wedding-groom",
    nameEn: "Wedding & Groom",
    nameAr: "الزفاف والعريس",
    sortOrder: 2,
    active: true,
  },
  {
    id: "business",
    slug: "business",
    nameEn: "Business",
    nameAr: "رجال الأعمال",
    sortOrder: 3,
    active: true,
  },
  {
    id: "resort-summer",
    slug: "resort-summer",
    nameEn: "Resort & Summer",
    nameAr: "المنتجعات والصيف",
    sortOrder: 4,
    active: true,
  },
] as const;

const RAW_PRODUCTS = applyProductDescriptions([
  {
    slug: "classic-black-tuxedo",
    sku: "VOGO-001",
    collectionSlug: "evening-formal",
    featuredCarousel: true,
    nameAr: "بدلة السهرة الكلاسيكية السوداء",
    nameEn: "Classic Black Evening Tuxedo",
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
    price: 180,
    imageSrc: "/images/products/ivory-linen-blazer.png",
  },
]);

type StaticProduct = (typeof RAW_PRODUCTS)[number] & {
  descEn: string;
  descAr: string;
  featuredCarousel: boolean;
};

export const STATIC_PRODUCTS: StaticProduct[] = RAW_PRODUCTS as StaticProduct[];

export const FITTING_ROOM_STATIC_CATALOG: FittingRoomProduct[] = STATIC_PRODUCTS.map((p) => ({
  id: p.slug,
  slug: p.slug,
  nameAr: p.nameAr,
  nameEn: p.nameEn,
  descAr: p.descAr,
  descEn: p.descEn,
  imageSrc: p.imageSrc,
  price: p.price,
}));

export function getStaticFittingRoomProductById(id: string): FittingRoomProduct | null {
  return FITTING_ROOM_STATIC_CATALOG.find((p) => p.id === id || p.slug === id) ?? null;
}

export function getStaticFittingRoomProductBySlug(slug: string): FittingRoomProduct | null {
  return FITTING_ROOM_STATIC_CATALOG.find((p) => p.slug === slug) ?? null;
}

export function getStaticCarouselProducts(): CollectionCarouselProduct[] {
  return STATIC_PRODUCTS.filter((p) => p.featuredCarousel).map(toCarouselProduct);
}

export function getStaticShopProductsByCollection() {
  return STATIC_COLLECTIONS.map((collection) => ({
    ...collection,
    products: STATIC_PRODUCTS.filter((p) => p.collectionSlug === collection.slug).map(
      (product) => ({
        id: product.slug,
        slug: product.slug,
        sku: product.sku,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        descAr: product.descAr,
        descEn: product.descEn,
        price: product.price,
        imageSrc: product.imageSrc,
        active: true,
        featuredCarousel: product.featuredCarousel,
        collectionId: collection.id,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      })
    ),
  })).filter((collection) => collection.products.length > 0);
}

function toCarouselProduct(product: StaticProduct): CollectionCarouselProduct {
  return {
    id: product.slug,
    slug: product.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descAr: product.descAr,
    descEn: product.descEn,
    price: product.price,
    imageSrc: product.imageSrc,
  };
}
