export type CollectionCarouselProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  salePrice?: number;
  saleBadgeEn?: string;
  saleBadgeAr?: string;
  imageSrc: string;
};

export type ShopProductWithCollection = CollectionCarouselProduct & {
  collection: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
  } | null;
};
