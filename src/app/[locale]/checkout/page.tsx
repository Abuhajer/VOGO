import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import SectionHeading from "@/components/ui/SectionHeading";
import { isStripeEnabled } from "@/lib/stripe";

export default async function CheckoutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");

  return (
    <main className="container mx-auto px-6 md:px-12 py-28 md:py-36">
      <SectionHeading label={t("eyebrow")} title={t("title")} />
      <div className="mt-10">
        <CheckoutForm stripeEnabled={isStripeEnabled()} />
      </div>
    </main>
  );
}
