"use client";

import { Link, usePathname } from "@/i18n/routing";
import { Role } from "@/types/db";

export default function AdminNav({ locale, role }: { locale: string; role?: Role }) {
  const pathname = usePathname();

  if (role !== Role.ADMIN) return null;

  const links = [
    { href: "/admin", label: locale === "ar" ? "نظرة عامة" : "Overview", exact: true },
    { href: "/admin/products", label: locale === "ar" ? "المنتجات" : "Products" },
    { href: "/admin/collections", label: locale === "ar" ? "التصنيفات" : "Categories" },
    { href: "/admin/promotions", label: locale === "ar" ? "العروض" : "Promotions" },
    { href: "/admin/avatars", label: locale === "ar" ? "نماذج القياس" : "Fitting avatars" },
    { href: "/admin/settings", label: locale === "ar" ? "الإعدادات" : "Settings" },
    { href: "/admin/orders", label: locale === "ar" ? "الطلبات" : "Orders" },
    { href: "/admin/customers", label: locale === "ar" ? "العملاء" : "Customers" },
  ];

  return (
    <nav className="admin-nav-scroll mb-6 border-b border-gold-glow/10 pb-3" aria-label={locale === "ar" ? "إدارة المتجر" : "Admin navigation"}>
      <div className="flex gap-2 overflow-x-auto px-0.5 pb-1 snap-x snap-mandatory scrollbar-hide">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`snap-start shrink-0 min-h-10 inline-flex items-center px-3.5 py-2 rounded-sm text-[11px] uppercase tracking-wider transition-colors sm:px-4 sm:text-xs ${
                active
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "text-ivory-muted hover:text-gold border border-transparent hover:border-gold/20"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
