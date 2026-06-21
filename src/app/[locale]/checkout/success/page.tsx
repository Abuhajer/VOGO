import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getOrderByNumber } from "@/server/orders";
import { formatNumber } from "@/lib/format";
import ClearCartOnSuccess from "@/components/checkout/ClearCartOnSuccess";

export default async function CheckoutSuccessPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { order?: string; whatsapp?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");
  const order = searchParams.order ? await getOrderByNumber(searchParams.order) : null;
  const viaWhatsapp = searchParams.whatsapp === "1";

  return (
    <main
      className="container mx-auto px-6 md:px-12 py-28 md:py-36 max-w-2xl text-center"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {order || viaWhatsapp ? (
        <ClearCartOnSuccess subtotal={order?.total} />
      ) : null}

      <h1 className="font-serif text-4xl text-ivory mb-4">{t("successTitle")}</h1>
      {viaWhatsapp ? (
        <p className="text-ivory-muted">{t("successWhatsapp")}</p>
      ) : order ? (
        <>
          <p className="text-ivory-muted mb-2">{t("successBody")}</p>
          <p className="text-gold font-serif text-xl mb-2">{order.orderNumber}</p>
          <p className="text-ivory-muted">
            {formatNumber(order.total, locale)} {locale === "ar" ? "د.أ" : "JOD"}
          </p>
        </>
      ) : (
        <p className="text-ivory-muted">{t("successBody")}</p>
      )}
      <Link href="/shop" className="inline-block mt-8 px-6 py-3 border border-gold/40 text-gold rounded-sm">
        {t("continueShopping")}
      </Link>
    </main>
  );
}
