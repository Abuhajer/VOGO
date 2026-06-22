import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutCancelledNotice from "@/components/checkout/CheckoutCancelledNotice";
import SectionHeading from "@/components/ui/SectionHeading";
import { isStripeEnabled } from "@/lib/stripe";

export default async function CheckoutPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { cancelled?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");
  const cancelled = searchParams.cancelled === "1";

  return (
    <main className="container mx-auto px-6 md:px-12 py-28 md:py-36">
      <SectionHeading label={t("eyebrow")} title={t("title")} />
      {cancelled ? <CheckoutCancelledNotice /> : null}
      <div className="mt-10">
        <CheckoutForm stripeEnabled={isStripeEnabled()} />
      </div>
    </main>
  );
}
