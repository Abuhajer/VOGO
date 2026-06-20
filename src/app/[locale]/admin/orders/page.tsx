import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminOrders } from "@/server/orders";
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

  const title = locale === "ar" ? "إدارة الطلبات" : "Manage Orders";
  const orders = await getAdminOrders();

  return (
    <AdminShell locale={locale} role={session.user.role} title={title}>
      <AdminOrdersClient orders={orders} />
    </AdminShell>
  );
}
