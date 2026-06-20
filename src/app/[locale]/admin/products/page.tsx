import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminProducts } from "@/server/admin-actions";
import { getCollectionsForAdmin } from "@/server/collections";
import AdminShell from "@/components/admin/AdminShell";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export default async function AdminProductsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Products" });
  const [products, collections] = await Promise.all([getAdminProducts(), getCollectionsForAdmin()]);

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminProductsClient products={products} collections={collections} />
    </AdminShell>
  );
}
