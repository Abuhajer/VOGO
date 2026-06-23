"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Role } from "@/types/db";
import UserAvatar from "@/components/navigation/UserAvatar";

const MENU_WIDTH = 240;
const MENU_GAP = 8;
const VIEWPORT_GUTTER = 12;

type MenuPosition = {
  top: number;
  left: number;
};

type Props = {
  variant?: "desktop" | "mobile" | "drawer";
  onNavigate?: () => void;
  className?: string;
};

function getMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_GUTTER;
  const left = Math.min(Math.max(rect.right - MENU_WIDTH, VIEWPORT_GUTTER), maxLeft);

  return {
    top: rect.bottom + MENU_GAP,
    left,
  };
}

export default function UserAccountMenu({
  variant = "desktop",
  onNavigate,
  className = "",
}: Props) {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const isLoading = status === "loading";
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || t("guest");
  const isAdmin = user?.role === Role.ADMIN;
  const avatarImage = user?.image?.trim() || null;

  const close = useCallback(() => setOpen(false), []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    setMenuPosition(getMenuPosition(triggerRef.current));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const onViewportChange = () => updateMenuPosition();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  if (variant === "drawer") {
    if (isLoading) {
      return (
        <div
          className={`h-12 w-full animate-pulse rounded-sm border border-gold-glow/10 bg-surface/40 ${className}`}
          aria-hidden
        />
      );
    }

    if (!user) {
      return (
        <Link
          href="/login"
          onClick={onNavigate}
          className={`flex min-h-12 w-full items-center justify-center rounded-sm border border-gold/35 bg-gold/12 px-4 text-sm font-semibold text-gold transition-colors hover:border-gold/50 hover:bg-gold/18 light:text-[#7A5E22] ${className}`}
        >
          {t("signIn")}
        </Link>
      );
    }

    const drawerLinkClass = (active?: boolean) =>
      `flex min-h-11 w-full items-center rounded-sm border px-3.5 text-sm font-medium transition-colors ${
        active
          ? "border-gold/30 bg-gold/10 text-gold"
          : "border-transparent text-ivory hover:border-gold/20 hover:bg-gold/5 light:text-[#0E0D12] light:hover:bg-gold/8"
      }`;

    return (
      <div className={`flex flex-col gap-2 ${className}`} dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="flex items-center gap-3 rounded-sm border border-gold-glow/12 bg-void/40 px-3 py-3 light:border-[#0E0D12]/10 light:bg-white/80">
          <UserAvatar image={avatarImage} name={displayName} size="md" className="h-10 w-10 shrink-0 text-base" />
          <div className="min-w-0 flex-1 text-start">
            <p className="truncate text-sm font-medium text-ivory light:text-[#0E0D12]">{displayName}</p>
            <p className="truncate text-xs text-ivory-faint light:text-[#4A453F]">{user.email}</p>
            {isAdmin ? (
              <span className="mt-1.5 inline-flex rounded-sm border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-gold">
                {t("adminBadge")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={drawerLinkClass(pathname === "/dashboard")}
          >
            {t("myAccount")}
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              onClick={onNavigate}
              className={drawerLinkClass(pathname.startsWith("/admin"))}
            >
              {t("adminPanel")}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              void signOut({ callbackUrl: `/${locale}` });
            }}
            className="mt-1 flex min-h-10 w-full items-center justify-center rounded-sm border border-gold-glow/18 bg-void/30 px-3 text-sm font-medium text-ivory/80 transition-colors hover:border-gold/30 hover:bg-gold/8 hover:text-gold light:border-[#0E0D12]/12 light:bg-white/50 light:text-[#4A453F] light:hover:text-[#7A5E22]"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    );
  }

  if (variant === "mobile") {
    if (isLoading) return null;

    if (!user) {
      return (
        <Link
          href="/login"
          onClick={onNavigate}
          className={`text-xl text-ivory hover:text-gold transition-colors font-sans font-medium light:text-[#0E0D12] ${
            locale === "ar" ? "" : "tracking-[0.15em] uppercase"
          } ${className}`}
        >
          {t("signIn")}
        </Link>
      );
    }

    return (
      <div className={`flex flex-col items-center gap-4 ${className}`} dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="flex items-center gap-3">
          <UserAvatar image={avatarImage} name={displayName} size="md" className="h-11 w-11 text-lg" />
          <div className="text-start">
            <p className="text-sm font-medium text-ivory">{displayName}</p>
            <p className="text-xs text-ivory-faint">{user.email}</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={`text-lg text-ivory hover:text-gold ${pathname === "/dashboard" ? "!text-gold" : ""}`}
        >
          {t("myAccount")}
        </Link>
        {isAdmin ? (
          <Link href="/admin" onClick={onNavigate} className="text-lg text-ivory hover:text-gold">
            {t("adminPanel")}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void signOut({ callbackUrl: `/${locale}` });
          }}
          className="text-sm text-ivory-faint hover:text-gold transition-colors"
        >
          {t("signOut")}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <span
        className={`inline-block h-7 w-7 rounded-full border border-gold-glow/15 bg-surface/40 animate-pulse ${className}`}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={`hidden lg:inline-flex shrink-0 items-center justify-center min-h-7 px-2 rounded-sm text-[9px] font-semibold uppercase tracking-[0.1em] border border-gold/30 text-gold hover:bg-gold/10 transition-colors light:text-[#7A5E22] light:border-[#B38E36]/45 ${className}`}
      >
        {t("signIn")}
      </Link>
    );
  }

  return (
    <div ref={rootRef} dir="ltr" className={`relative shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="user-menu-trigger flex items-center gap-1.5 rounded-sm border border-transparent py-0.5 ps-0.5 pe-1 transition-colors hover:border-gold-glow/20 hover:bg-surface/40 light:hover:bg-[#EFE8E2]/80 xl:pe-1.5"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("accountMenu")}
      >
        <UserAvatar image={avatarImage} name={displayName} size="sm" />
        <span className="hidden max-w-[5.5rem] truncate text-[9px] font-medium text-ivory-muted light:text-[#4A453F] xl:inline">
          {displayName}
        </span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`hidden shrink-0 text-gold/70 transition-transform xl:block ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>

      {open && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="user-menu-dropdown fixed z-[100] w-[15rem] overflow-hidden rounded-sm border border-gold-glow/20 bg-obsidian shadow-[0_20px_50px_rgba(0,0,0,0.45)] light:bg-[#FAF7F2] light:shadow-[0_16px_40px_rgba(14,13,18,0.12)]"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <div className="border-b border-gold-glow/10 px-4 py-3">
                <p className="truncate text-sm font-medium text-ivory light:text-[#0E0D12]">{displayName}</p>
                <p className="truncate text-xs text-ivory-faint light:text-[#4A453F]">{user.email}</p>
                {isAdmin ? (
                  <span className="mt-2 inline-flex rounded-[2px] border border-gold/25 bg-gold/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-gold">
                    {t("adminBadge")}
                  </span>
                ) : null}
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={close}
                  className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-gold/8 hover:text-gold light:hover:text-[#8A6E2F] ${
                    pathname === "/dashboard" ? "text-gold" : "text-ivory-muted light:text-[#4A453F]"
                  }`}
                >
                  {t("myAccount")}
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={close}
                    className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-gold/8 hover:text-gold light:hover:text-[#8A6E2F] ${
                      pathname.startsWith("/admin") ? "text-gold" : "text-ivory-muted light:text-[#4A453F]"
                    }`}
                  >
                    {t("adminPanel")}
                  </Link>
                ) : null}
              </div>

              <div className="border-t border-gold-glow/10 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    void signOut({ callbackUrl: `/${locale}` });
                  }}
                  className="flex w-full items-center px-4 py-2.5 text-start text-sm text-ivory-faint transition-colors hover:bg-gold/8 hover:text-gold light:text-[#4A453F] light:hover:text-[#8A6E2F]"
                >
                  {t("signOut")}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
