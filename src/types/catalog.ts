export type CollectionCarouselProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
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
