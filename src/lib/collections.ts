export function localizeCollectionName(
  collection: { nameAr: string; nameEn: string },
  locale: string
) {
  return locale === "ar" ? collection.nameAr : collection.nameEn;
}
