import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getOrderStatusLabels } from "@/lib/order-status";
import { getCustomerOrderDetail } from "@/server/customer-orders";
import CustomerOrderDetailView from "@/components/dashboard/CustomerOrderDetailView";
import PageShell from "@/components/layout/PageShell";

export default async function CustomerOrderPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const order = await getCustomerOrderDetail(id);
  if (!order) notFound();

  const tStatus = await getTranslations({ locale, namespace: "OrderStatus" });
  const statusLabels = getOrderStatusLabels(tStatus);

  return (
    <PageShell dir={locale === "ar" ? "rtl" : "ltr"} width="medium">
      <CustomerOrderDetailView order={order} statusLabels={statusLabels} />
    </PageShell>
  );
}
