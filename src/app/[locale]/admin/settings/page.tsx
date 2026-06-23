import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getTryOnSettingsSnapshot } from "@/server/try-on-settings";
import AdminShell from "@/components/admin/AdminShell";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";

export default async function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Settings" });
  const settings = await getTryOnSettingsSnapshot();

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminSettingsClient settings={settings} />
    </AdminShell>
  );
}
