import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getStaticProductSlugs } from "@/lib/catalog/static-catalog";
import { absoluteUrl } from "@/lib/site";

const publicPaths = [
  "",
  "/shop",
  "/fitting-room",
  "/cart",
  "/checkout",
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const productSlugs = getStaticProductSlugs();

  for (const locale of routing.locales) {
    for (const path of publicPaths) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "daily",
        priority: path === "" ? 1 : path === "/fitting-room" ? 0.9 : 0.8,
      });
    }

    for (const slug of productSlugs) {
      entries.push({
        url: absoluteUrl(`/${locale}/shop/${slug}`),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  return entries;
}
