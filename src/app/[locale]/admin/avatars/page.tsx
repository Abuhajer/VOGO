import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminAvatars } from "@/server/fitting-room-avatars";
import AdminShell from "@/components/admin/AdminShell";
import AdminAvatarsClient from "@/components/admin/AdminAvatarsClient";

export default async function AdminAvatarsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Avatars" });
  const avatars = await getAdminAvatars();

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminAvatarsClient avatars={avatars} />
    </AdminShell>
  );
}
