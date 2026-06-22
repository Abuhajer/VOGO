"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useAppToast } from "@/hooks/useAppToast";

export default function NewsletterSignup() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const { newsletterSuccess, newsletterError } = useAppToast();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (response.ok) {
        setEmail("");
        setStatus("idle");
        newsletterSuccess();
        return;
      }

      setStatus("error");
      newsletterError();
    } catch {
      setStatus("error");
      newsletterError();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      dir={isAr ? "rtl" : "ltr"}
      className="flex flex-col sm:flex-row gap-3 max-w-md"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={isAr ? "بريدك الإلكتروني" : "Your email"}
        className="flex-1 bg-void border border-gold-glow/20 rounded-sm px-4 py-3 text-sm text-ivory"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-5 py-3 bg-gold text-void text-xs font-semibold rounded-sm disabled:opacity-60"
      >
        {status === "loading"
          ? isAr
            ? "جاري..."
            : "Sending..."
          : isAr
            ? "اشتراك"
            : "Subscribe"}
      </button>
    </form>
  );
}
