import { siteImages } from "./images";
import { BUSINESS_LOCATION, getLocationAddress } from "./location";
import { absoluteUrl } from "./site";
import { BRAND, BRAND_LOGO } from "./brand";

export function getOrganizationSchema(locale: string) {
  const isAr = locale === "ar";
  const streetAddress = getLocationAddress(locale);
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: isAr ? BRAND.nameAr : BRAND.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(BRAND_LOGO.path),
    image: absoluteUrl(siteImages.og),
    telephone: "+962797226984",
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality: isAr ? "عمّان" : "Amman",
      postalCode: BUSINESS_LOCATION.postalCode,
      addressCountry: "JO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_LOCATION.lat,
      longitude: BUSINESS_LOCATION.lng,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(streetAddress)}`,
    sameAs: [
      "https://www.facebook.com/vogobyfame",
      "https://www.instagram.com/vogobyfame",
    ],
    description: isAr
      ? `${BRAND.nameAr} — الخيار الأول لكل رجل مميز يبحث عن الأناقة والفخامة للبدلات الرسمية وبدلات العرسان في عمّان.`
      : `${BRAND.name} — premium bespoke menswear and luxury groom suits in Amman, Jordan.`,
  };
}
