export const BUSINESS_LOCATION = {
  lat: 31.993307,
  lng: 35.861736,
  postalCode: "11118",
  address: {
    ar: "ش. وصفي التل، عمّان 11118",
    en: "Wasfi Al-Tal St., Amman 11118",
  },
} as const;

export function getLocationAddress(locale: string) {
  return locale === "ar"
    ? BUSINESS_LOCATION.address.ar
    : BUSINESS_LOCATION.address.en;
}

export function getGoogleMapsLink(locale: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocationAddress(locale))}`;
}

export function getGoogleMapsEmbedUrl(locale: string) {
  const hl = locale === "ar" ? "ar" : "en";
  const label = encodeURIComponent(getLocationAddress(locale));
  const { lat, lng } = BUSINESS_LOCATION;

  // Pin at Wasfi Al-Tal with the exact boutique address as the map label.
  return `https://maps.google.com/maps?q=${lat},${lng}+(${label})&hl=${hl}&z=17&output=embed`;
}
