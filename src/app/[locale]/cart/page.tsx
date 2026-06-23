import { getTranslations, setRequestLocale } from "next-intl/server";
import CartView from "@/components/cart/CartView";
import SectionHeading from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/routing";
import PageShell from "@/components/layout/PageShell";

export default async function CartPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Cart");
  const isAr = locale === "ar";

  return (
    <PageShell width="cart" dir={isAr ? "rtl" : "ltr"}>
      <nav
        className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ivory-faint"
        dir={isAr ? "rtl" : "ltr"}
        aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}
      >
        <Link href="/" className="transition-colors hover:text-gold">
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span aria-hidden className="text-gold/40">
          /
        </span>
        <Link href="/shop" className="transition-colors hover:text-gold">
          {isAr ? "المتجر" : "Shop"}
        </Link>
        <span aria-hidden className="text-gold/40">
          /
        </span>
        <span className="text-ivory-muted">{t("title")}</span>
      </nav>

      <SectionHeading label={t("eyebrow")} title={t("title")} />

      <p className="mt-3 max-w-2xl text-sm text-ivory-muted" dir={isAr ? "rtl" : "ltr"}>
        {t("pageDesc")}
      </p>

      <div className="mt-8 md:mt-10">
        <CartView />
      </div>
    </PageShell>
  );
}
