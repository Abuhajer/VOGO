import { getCarouselProducts } from "@/server/collections";
import HomePageClient from "@/components/home/HomePageClient";

export default async function Home() {
  const carouselProducts = await getCarouselProducts();

  return <HomePageClient carouselProducts={carouselProducts} />;
}
