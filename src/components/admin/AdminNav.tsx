"use client";

import { Link, usePathname } from "@/i18n/routing";
import { Role } from "@/types/db";

export default function AdminNav({ locale, role }: { locale: string; role?: Role }) {
  const pathname = usePathname();

  if (role !== Role.ADMIN) return null;

  const links = [
    { href: "/admin", label: locale === "ar" ? "نظرة عامة" : "Overview", exact: true },
    { href: "/admin/products", label: locale === "ar" ? "المنتجات" : "Products" },
    { href: "/admin/avatars", label: locale === "ar" ? "نماذج القياس" : "Fitting avatars" },
    { href: "/admin/orders", label: locale === "ar" ? "الطلبات" : "Orders" },
    { href: "/admin/customers", label: locale === "ar" ? "العملاء" : "Customers" },
  ];

  return (
    <nav className="flex flex-wrap gap-2 mb-8 border-b border-gold-glow/10 pb-4">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-sm text-xs uppercase tracking-wider transition-colors ${
              active
                ? "bg-gold/10 text-gold border border-gold/30"
                : "text-ivory-muted hover:text-gold border border-transparent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
