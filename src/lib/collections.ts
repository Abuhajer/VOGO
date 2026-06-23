export function localizeCollectionName(
  collection: { nameAr: string; nameEn: string },
  locale: string
) {
  return locale === "ar" ? collection.nameAr : collection.nameEn;
}

export function slugifyCollectionName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function emptyCollectionForm(sortOrder = 1) {
  return {
    slug: "",
    nameEn: "",
    nameAr: "",
    sortOrder,
    active: true,
  };
}
