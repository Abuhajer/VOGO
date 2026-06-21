import { getCarouselProducts } from "@/server/collections";
import { getStaticCarouselProducts } from "@/lib/catalog/static-catalog";
import HomePageClient from "@/components/home/HomePageClient";

export default async function Home() {
  let carouselProducts = getStaticCarouselProducts();

  try {
    carouselProducts = await getCarouselProducts();
  } catch (err) {
    console.error("[home] carousel load failed", err);
  }

  return <HomePageClient carouselProducts={carouselProducts} />;
}
