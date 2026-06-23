import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminCollections } from "@/server/collection-actions";
import AdminShell from "@/components/admin/AdminShell";
import AdminCollectionsClient from "@/components/admin/AdminCollectionsClient";

export default async function AdminCollectionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Collections" });
  const collections = await getAdminCollections();

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminCollectionsClient collections={collections} />
    </AdminShell>
  );
}
