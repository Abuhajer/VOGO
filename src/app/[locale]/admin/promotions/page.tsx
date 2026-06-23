import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/db";
import { getAdminProducts } from "@/server/admin-actions";
import { getCollectionsForAdmin } from "@/server/collections";
import { getAdminPromotions } from "@/server/promotions";
import AdminShell from "@/components/admin/AdminShell";
import AdminPromotionsClient from "@/components/admin/AdminPromotionsClient";

export default async function AdminPromotionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== Role.ADMIN) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "Admin.Promotions" });
  const [promotions, collections, products] = await Promise.all([
    getAdminPromotions(),
    getCollectionsForAdmin(),
    getAdminProducts(),
  ]);

  return (
    <AdminShell locale={locale} role={session.user.role} title={t("title")}>
      <AdminPromotionsClient
        promotions={promotions}
        collections={collections.map((collection) => ({
          id: collection.id,
          nameAr: collection.nameAr,
          nameEn: collection.nameEn,
        }))}
        products={products.map((product) => ({
          id: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          collectionId: product.collectionId,
        }))}
      />
    </AdminShell>
  );
}
