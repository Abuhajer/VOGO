import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutCancelledNotice from "@/components/checkout/CheckoutCancelledNotice";
import SectionHeading from "@/components/ui/SectionHeading";
import { isStripeEnabled } from "@/lib/stripe";
import { getAccountProfile } from "@/server/profile";
import PageShell from "@/components/layout/PageShell";

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

  const session = await auth();
  const profile = session?.user?.id ? await getAccountProfile(session.user.id) : null;
  const prefill = profile
    ? {
        customerName: profile.name ?? "",
        customerEmail: profile.email,
        customerPhone: profile.phone ?? "",
      }
    : null;

  return (
    <PageShell dir={locale === "ar" ? "rtl" : "ltr"}>
      <SectionHeading label={t("eyebrow")} title={t("title")} />
      {cancelled ? <CheckoutCancelledNotice /> : null}
      <div className="mt-8 sm:mt-10">
        <CheckoutForm
          stripeEnabled={isStripeEnabled()}
          prefill={prefill}
          emailLocked={Boolean(session?.user)}
        />
      </div>
    </PageShell>
  );
}
