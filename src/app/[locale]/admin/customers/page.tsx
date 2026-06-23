import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getOrderStatusLabels } from "@/lib/order-status";
import { getAdminCustomerSummaries } from "@/server/customers";
import AdminShell from "@/components/admin/AdminShell";
import AdminCustomersClient from "@/components/admin/AdminCustomersClient";

export default async function AdminCustomersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Customers" });
  const tStatus = await getTranslations({ locale, namespace: "OrderStatus" });
  const customers = await getAdminCustomerSummaries();
  const statusLabels = getOrderStatusLabels(tStatus);

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminCustomersClient customers={customers} statusLabels={statusLabels} />
    </AdminShell>
  );
}
