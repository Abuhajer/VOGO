export function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateNextSkuFromList(skus: string[]): string {
  const prefix = "VOGO-";
  let max = 0;

  for (const sku of skus) {
    const match = sku.match(/^VOGO-(\d+)$/i);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export const PRODUCT_IMAGE_PRESETS = [
  "/images/products/classic-black-tuxedo.png",
  "/images/products/royal-navy-wedding-tuxedo.png",
  "/images/products/charcoal-double-breasted.png",
  "/images/products/burgundy-velvet-blazer.png",
  "/images/products/ivory-linen-blazer.png",
] as const;

export const emptyProductForm = {
  slug: "",
  sku: "",
  nameAr: "",
  nameEn: "",
  descAr: "",
  descEn: "",
  price: 0,
  imageSrc: PRODUCT_IMAGE_PRESETS[0],
  sizeChartJson: null as string | null,
  customSizeEnabled: true,
  active: true,
  featuredCarousel: false,
  collectionId: null as string | null,
};

type ProductLike = {
  slug: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  imageSrc: string;
  sizeChartJson?: string | null;
  customSizeEnabled: boolean;
  active: boolean;
  featuredCarousel: boolean;
  collectionId?: string | null;
};

/** Ensures every form field is defined — avoids uncontrolled React inputs on edit. */
export function productToFormInput(
  product: ProductLike,
  fallbackCollectionId: string | null = null
) {
  return {
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    nameAr: product.nameAr ?? "",
    nameEn: product.nameEn ?? "",
    descAr: product.descAr ?? "",
    descEn: product.descEn ?? "",
    price: Number.isFinite(product.price) ? product.price : 0,
    imageSrc: product.imageSrc || PRODUCT_IMAGE_PRESETS[0],
    sizeChartJson: product.sizeChartJson ?? null,
    customSizeEnabled: product.customSizeEnabled ?? true,
    active: product.active ?? true,
    featuredCarousel: product.featuredCarousel ?? false,
    collectionId: product.collectionId ?? fallbackCollectionId,
  };
}
