import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getOrderStatusLabels } from "@/lib/order-status";
import { getAccountDashboardData } from "@/server/dashboard";
import AccountDashboardView from "@/components/dashboard/AccountDashboardView";
import PageShell from "@/components/layout/PageShell";

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
    <PageShell dir={locale === "ar" ? "rtl" : "ltr"} width="wide">
      <AccountDashboardView data={data} statusLabels={statusLabels} />
    </PageShell>
  );
}
