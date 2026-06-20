"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

const STORAGE_KEY = "vogo-cookie-consent";

export default function CookieConsent() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 inset-x-4 z-[60] mx-auto max-w-lg rounded-sm border border-gold-glow/20 bg-obsidian/95 p-4 shadow-xl backdrop-blur-md sm:inset-x-auto sm:end-6 sm:start-auto"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <p className="text-xs leading-relaxed text-ivory-muted font-sans font-light">
        {isArabic
          ? "نستخدم ملفات تعريف الارتباط لتحسين تجربتك وقياس الزيارات. بمتابعة التصفح، فإنك توافق على ذلك."
          : "We use cookies to improve your experience and measure visits. By continuing, you agree to this."}
      </p>
      <button
        type="button"
        onClick={accept}
        className="mt-3 min-h-[40px] rounded-sm bg-gold px-4 py-2 text-[11px] font-semibold text-[#0E0D12] transition-colors hover:bg-gold-muted"
      >
        {isArabic ? "موافق" : "Accept"}
      </button>
    </div>
  );
}
