import { applyProductDescriptions } from "../../../prisma/product-descriptions";
import type { FittingRoomProduct } from "@/lib/try-on/types";

/** Static catalog used when DATABASE_URL is unavailable (e.g. Netlify before DB is configured). */
const RAW = applyProductDescriptions([
  {
    slug: "classic-black-tuxedo",
    collectionSlug: "evening-formal",
    nameAr: "بدلة السهرة الكلاسيكية السوداء",
    nameEn: "Classic Black Evening Tuxedo",
    price: 280,
    imageSrc: "/images/products/classic-black-tuxedo.png",
  },
  {
    slug: "royal-navy-wedding-tuxedo",
    collectionSlug: "wedding-groom",
    nameAr: "تكسيدو الزفاف الكحلي الملكي",
    nameEn: "Royal Navy Wedding Tuxedo",
    price: 350,
    imageSrc: "/images/products/royal-navy-wedding-tuxedo.png",
  },
  {
    slug: "charcoal-double-breasted",
    collectionSlug: "business",
    nameAr: "البدلة الرمادية المخططة المزدوجة",
    nameEn: "Charcoal Double-Breasted Pinstripe",
    price: 290,
    imageSrc: "/images/products/charcoal-double-breasted.png",
  },
  {
    slug: "burgundy-velvet-blazer",
    collectionSlug: "evening-formal",
    nameAr: "سترة السهرة المخملية البرغندي",
    nameEn: "Burgundy Velvet Evening Blazer",
    price: 260,
    imageSrc: "/images/products/burgundy-velvet-blazer.png",
  },
  {
    slug: "ivory-linen-blazer",
    collectionSlug: "resort-summer",
    nameAr: "سترة الكتان العاجية الفاخرة",
    nameEn: "Ivory Luxury Linen Blazer",
    price: 180,
    imageSrc: "/images/products/ivory-linen-blazer.png",
  },
]);

export const FITTING_ROOM_STATIC_CATALOG: FittingRoomProduct[] = RAW.map((p) => {
  const { descEn, descAr } = p as typeof p & { descEn: string; descAr: string };
  return {
    id: p.slug,
    slug: p.slug,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    descAr,
    descEn,
    imageSrc: p.imageSrc,
    price: p.price,
  };
});

export function getStaticFittingRoomProductById(id: string): FittingRoomProduct | null {
  return FITTING_ROOM_STATIC_CATALOG.find((p) => p.id === id || p.slug === id) ?? null;
}

export function getStaticFittingRoomProductBySlug(slug: string): FittingRoomProduct | null {
  return FITTING_ROOM_STATIC_CATALOG.find((p) => p.slug === slug) ?? null;
}
