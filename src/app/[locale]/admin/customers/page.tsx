import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminCustomers } from "@/server/orders";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminCustomersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const title = locale === "ar" ? "العملاء" : "Customers";
  const customers = await getAdminCustomers();

  return (
    <AdminShell locale={locale} role={session.user.role} title={title}>
      <div className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-ivory-muted">
            {locale === "ar" ? "لا يوجد عملاء بعد." : "No customers yet."}
          </p>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="border border-gold-glow/15 rounded-sm p-4 bg-obsidian flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-ivory font-serif">{customer.name ?? customer.email}</p>
                <p className="text-sm text-ivory-muted">{customer.email}</p>
              </div>
              <p className="text-gold text-sm">
                {customer._count.orders} {locale === "ar" ? "طلب" : "orders"}
              </p>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
