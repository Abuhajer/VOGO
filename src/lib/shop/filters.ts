export type ShopSortOption = "featured" | "newest" | "price-asc" | "price-desc" | "name";

export type ShopPriceRange = "under-250" | "250-299" | "300-plus";

export type ShopProduct = {
  id: string;
  slug: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  salePrice?: number;
  saleBadgeEn?: string;
  saleBadgeAr?: string;
  imageSrc: string;
  active: boolean;
  featuredCarousel: boolean;
  collectionId: string | null;
  createdAt: string;
  updatedAt: string;
  collection: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
  };
};

export function getShopDisplayPrice(product: Pick<ShopProduct, "price" | "salePrice">) {
  return product.salePrice != null && product.salePrice < product.price
    ? product.salePrice
    : product.price;
}

export type ShopCollection = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
};

export const SHOP_SORT_OPTIONS: ShopSortOption[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "name",
];

export const SHOP_PRICE_RANGES: ShopPriceRange[] = ["under-250", "250-299", "300-plus"];

export function parseShopSort(value: string | null | undefined): ShopSortOption {
  if (value && SHOP_SORT_OPTIONS.includes(value as ShopSortOption)) {
    return value as ShopSortOption;
  }
  return "featured";
}

export function parseShopPriceRange(value: string | null | undefined): ShopPriceRange | null {
  if (value && SHOP_PRICE_RANGES.includes(value as ShopPriceRange)) {
    return value as ShopPriceRange;
  }
  return null;
}

export function parseShopCollection(
  value: string | null | undefined,
  collections: ShopCollection[]
): string | null {
  if (!value || value === "all") return null;
  return collections.some((c) => c.slug === value) ? value : null;
}

function matchesPriceRange(price: number, range: ShopPriceRange): boolean {
  switch (range) {
    case "under-250":
      return price < 250;
    case "250-299":
      return price >= 250 && price <= 299;
    case "300-plus":
      return price >= 300;
    default:
      return true;
  }
}

function sortProducts(products: ShopProduct[], sort: ShopSortOption, locale: string): ShopProduct[] {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => getShopDisplayPrice(a) - getShopDisplayPrice(b));
    case "price-desc":
      return sorted.sort((a, b) => getShopDisplayPrice(b) - getShopDisplayPrice(a));
    case "name": {
      const key = locale === "ar" ? "nameAr" : "nameEn";
      return sorted.sort((a, b) => a[key].localeCompare(b[key], locale));
    }
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
          a.slug.localeCompare(b.slug)
      );
    case "featured":
    default:
      return sorted.sort((a, b) => {
        const collectionCompare = a.collection.slug.localeCompare(b.collection.slug);
        if (collectionCompare !== 0) return collectionCompare;
        return a.slug.localeCompare(b.slug);
      });
  }
}

export function filterAndSortShopProducts({
  products,
  collectionSlug,
  priceRange,
  sort,
  locale,
}: {
  products: ShopProduct[];
  collectionSlug: string | null;
  priceRange: ShopPriceRange | null;
  sort: ShopSortOption;
  locale: string;
}): ShopProduct[] {
  let filtered = products;

  if (collectionSlug) {
    filtered = filtered.filter((p) => p.collection.slug === collectionSlug);
  }

  if (priceRange) {
    filtered = filtered.filter((p) => matchesPriceRange(getShopDisplayPrice(p), priceRange));
  }

  return sortProducts(filtered, sort, locale);
}

export function hasActiveShopFilters({
  collectionSlug,
  priceRange,
  sort,
}: {
  collectionSlug: string | null;
  priceRange: ShopPriceRange | null;
  sort: ShopSortOption;
}): boolean {
  return Boolean(collectionSlug || priceRange || sort !== "featured");
}
