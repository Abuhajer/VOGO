export function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
  active: true,
  featuredCarousel: false,
  collectionId: null,
};
