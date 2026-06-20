export const NAV_SECTIONS = [
  { key: "collection" as const, href: "#collection" },
  { key: "story" as const, href: "#story" },
  { key: "wedding" as const, href: "#wedding" },
  { key: "contact" as const, href: "#contact" },
];

export const STORE_LINKS = [
  { key: "shop" as const, href: "/shop" },
  { key: "fittingRoom" as const, href: "/fitting-room" },
  { key: "cart" as const, href: "/cart" },
  { key: "account" as const, href: "/dashboard" },
];

export type NavSectionKey = (typeof NAV_SECTIONS)[number]["key"];
export type StoreLinkKey = (typeof STORE_LINKS)[number]["key"];
