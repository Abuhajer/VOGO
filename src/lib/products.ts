export function localizeProduct(
  product: {
    nameAr: string;
    nameEn: string;
    descAr: string;
    descEn: string;
  },
  locale: string
) {
  const isAr = locale === "ar";
  return {
    name: isAr ? product.nameAr : product.nameEn,
    description: isAr ? product.descAr : product.descEn,
  };
}
