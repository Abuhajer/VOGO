import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site";

const publicPaths = ["", "/shop", "/cart", "/checkout", "/login", "/register"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of publicPaths) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "daily",
        priority: path === "" ? 1 : 0.8,
      });
    }
  }

  return entries;
}
