import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getOrderStatusLabels } from "@/lib/order-status";
import { getAccountDashboardData } from "@/server/dashboard";
import AccountDashboardView from "@/components/dashboard/AccountDashboardView";

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const tStatus = await getTranslations({ locale, namespace: "OrderStatus" });
  const statusLabels = getOrderStatusLabels(tStatus);
  const data = await getAccountDashboardData(session.user.id, locale, statusLabels);

  return (
    <main className="container mx-auto px-6 md:px-12 py-28 md:py-36" dir={locale === "ar" ? "rtl" : "ltr"}>
      <AccountDashboardView data={data} statusLabels={statusLabels} />
    </main>
  );
}
