import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getOrderStatusLabels } from "@/lib/order-status";
import { getAdminDashboardData } from "@/server/dashboard";
import AdminShell from "@/components/admin/AdminShell";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";

export default async function AdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Dashboard" });
  const tStatus = await getTranslations({ locale, namespace: "OrderStatus" });
  const statusLabels = getOrderStatusLabels(tStatus);
  const data = await getAdminDashboardData(statusLabels, locale);

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminDashboardView data={data} statusLabels={statusLabels} />
    </AdminShell>
  );
}
