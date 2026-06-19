import { BUSINESS_LOCATION, getLocationAddress } from "./location";

export function getOrganizationSchema(locale: string) {
  const isAr = locale === "ar";
  const streetAddress = getLocationAddress(locale);
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: isAr ? "برايم من ڤوچو" : "PRIME by VOGO BY FAME",
    url: "https://vogobyfame.com",
    logo: "https://vogobyfame.com/logo/prime-logo.svg",
    image: "https://vogobyfame.com/images/hero/hero_suit_man.png",
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
      ? "ڤوچو — الخيار الأول لكل رجل مميز يبحث عن الأناقة والفخامة للبدلات الرسمية وبدلات العرسان في عمّان."
      : "PRIME by VOGO — premium bespoke menswear and luxury groom suits in Amman, Jordan.",
  };
}
