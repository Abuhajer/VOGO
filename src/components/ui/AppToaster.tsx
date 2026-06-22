"use client";

import { useLocale } from "next-intl";
import { Toaster } from "sonner";

export default function AppToaster() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <Toaster
      dir={isArabic ? "rtl" : "ltr"}
      position={isArabic ? "top-left" : "top-right"}
      offset="max(1rem, env(safe-area-inset-top))"
      mobileOffset="max(0.75rem, env(safe-area-inset-top))"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "vogo-toast group !bg-obsidian !border !border-gold-glow/25 !text-ivory !shadow-[0_16px_48px_rgba(0,0,0,0.45)] !rounded-sm !font-sans !text-sm",
          title: "!text-ivory !font-medium",
          description: "!text-ivory-muted !text-xs",
          actionButton:
            "!bg-gold !text-void !font-semibold !rounded-sm hover:!bg-gold-muted",
          cancelButton:
            "!bg-surface !text-ivory-muted !border !border-gold-glow/20 !rounded-sm",
          closeButton:
            "!bg-surface/80 !border !border-gold-glow/20 !text-ivory-muted hover:!text-gold",
          success: "!border-gold/40 [&_[data-icon]]:!text-gold",
          error: "!border-error/40 [&_[data-icon]]:!text-error",
          info: "!border-gold-muted/40 [&_[data-icon]]:!text-gold-muted",
        },
      }}
    />
  );
}
