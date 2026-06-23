import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getOrderByNumber } from "@/server/orders";
import { formatNumber } from "@/lib/format";
import { OrderStatus, PaymentMethod } from "@/types/db";
import ClearCartOnSuccess from "@/components/checkout/ClearCartOnSuccess";
import PageShell from "@/components/layout/PageShell";

export default async function CheckoutSuccessPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { order?: string; whatsapp?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");
  const session = await auth();
  const order = searchParams.order ? await getOrderByNumber(searchParams.order) : null;
  const viaWhatsapp = searchParams.whatsapp === "1";

  const canViewOrder =
    order &&
    session?.user?.id &&
    (order.userId === session.user.id ||
      order.customerEmail.toLowerCase() === session.user.email?.toLowerCase());

  const paymentPending =
    order?.paymentMethod === PaymentMethod.STRIPE && order.status === OrderStatus.PENDING;

  return (
    <PageShell dir={locale === "ar" ? "rtl" : "ltr"} width="narrow" className="text-center">
      {order || viaWhatsapp ? (
        <ClearCartOnSuccess subtotal={order?.total} />
      ) : null}

      <h1 className="font-serif text-3xl text-ivory mb-4 sm:text-4xl">{t("successTitle")}</h1>
      {viaWhatsapp ? (
        <p className="text-ivory-muted">{t("successWhatsapp")}</p>
      ) : order ? (
        <>
          <p className="text-ivory-muted mb-2">
            {paymentPending ? t("successPaymentPending") : t("successBody")}
          </p>
          <p className="text-gold font-serif text-xl mb-2">{order.orderNumber}</p>
          <p className="text-ivory-muted">
            {formatNumber(order.total, locale)} {locale === "ar" ? "د.أ" : "JOD"}
          </p>
          {canViewOrder ? (
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm border border-gold/35 px-8 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
            >
              {t("viewOrder")}
            </Link>
          ) : session?.user ? null : (
            <p className="mt-6 text-sm text-ivory-muted">
              {t("successSignInHint")}{" "}
              <Link href="/login" className="text-gold hover:underline underline-offset-4">
                {t("successSignIn")}
              </Link>
            </p>
          )}
        </>
      ) : (
        <p className="text-ivory-muted">{t("successBody")}</p>
      )}
      <Link href="/shop" className="inline-block mt-8 px-6 py-3 border border-gold/40 text-gold rounded-sm">
        {t("continueShopping")}
      </Link>
    </PageShell>
  );
}
