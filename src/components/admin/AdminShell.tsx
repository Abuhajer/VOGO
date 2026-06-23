import { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { Role } from "@/types/db";
import AdminNav from "@/components/admin/AdminNav";
import PageShell from "@/components/layout/PageShell";

type AdminShellProps = {
  locale: string;
  role: Role;
  title: string;
  children: ReactNode;
};

export default function AdminShell({ locale, role, title, children }: AdminShellProps) {
  const isArabic = locale === "ar";

  return (
    <PageShell dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2 sm:mb-3">
            {isArabic ? "إدارة المتجر" : "Store management"}
          </p>
          <h1 className="font-serif text-2xl text-ivory sm:text-3xl md:text-4xl">{title}</h1>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 text-sm text-ivory-muted hover:text-gold transition-colors"
        >
          ← {isArabic ? "حسابي" : "My account"}
        </Link>
      </div>
      <AdminNav locale={locale} role={role} />
      {children}
    </PageShell>
  );
}
