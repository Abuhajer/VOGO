import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminOrders } from "@/server/orders";
import { getOrderStatusLabels } from "@/lib/order-status";
import AdminShell from "@/components/admin/AdminShell";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Orders" });
  const tStatus = await getTranslations({ locale, namespace: "OrderStatus" });
  const orders = await getAdminOrders();
  const statusLabels = getOrderStatusLabels(tStatus);

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <p className="text-sm text-ivory-muted mb-6 -mt-2">{t("subtitle")}</p>
      <AdminOrdersClient
        orders={orders.map((order) => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
        }))}
        statusLabels={statusLabels}
      />
    </AdminShell>
  );
}
