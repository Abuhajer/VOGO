import { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { Role } from "@/types/db";
import AdminNav from "@/components/admin/AdminNav";

type AdminShellProps = {
  locale: string;
  role: Role;
  title: string;
  children: ReactNode;
};

export default function AdminShell({ locale, role, title, children }: AdminShellProps) {
  const isArabic = locale === "ar";

  return (
    <main className="container mx-auto px-6 md:px-12 py-28 md:py-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
            {isArabic ? "إدارة المتجر" : "Store management"}
          </p>
          <h1 className="font-serif text-4xl text-ivory">{title}</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-ivory-muted hover:text-gold transition-colors">
          ← {isArabic ? "حسابي" : "My account"}
        </Link>
      </div>
      <AdminNav locale={locale} role={role} />
      {children}
    </main>
  );
}
