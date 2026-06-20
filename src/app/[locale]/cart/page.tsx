import { getTranslations, setRequestLocale } from "next-intl/server";
import CartView from "@/components/cart/CartView";
import SectionHeading from "@/components/ui/SectionHeading";

export default async function CartPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Cart");

  return (
    <main className="container mx-auto px-6 md:px-12 py-28 md:py-36 max-w-4xl">
      <SectionHeading label={t("eyebrow")} title={t("title")} />
      <div className="mt-10">
        <CartView />
      </div>
    </main>
  );
}
