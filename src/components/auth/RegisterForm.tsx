"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AnimatePresence, motion } from "framer-motion";
import AuthShell from "@/components/auth/AuthShell";
import { authInputClassName } from "@/components/auth/authInputClassName";
import PasswordField from "@/components/auth/PasswordField";
import PhoneInput from "@/components/form/PhoneInput";
import { registerCustomer } from "@/server/auth-actions";
import { useAppToast } from "@/hooks/useAppToast";

export default function RegisterForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isArabic = locale === "ar";
  const { registerSuccess } = useAppToast();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await registerCustomer(form);

    if (!result.ok) {
      setError(
        result.error === "EMAIL_EXISTS"
          ? t("emailExists")
          : result.error === "DATABASE_UNAVAILABLE"
            ? t("databaseUnavailable")
            : t("error")
      );
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    registerSuccess();

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell mode="register">
      <motion.form
        onSubmit={handleSubmit}
        className="relative space-y-5 rounded-sm border border-gold-glow/20 bg-obsidian/80 p-8 md:p-10 backdrop-blur-sm shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="space-y-2 pb-2">
          <p
            className={`text-gold text-[11px] font-sans ${
              isArabic ? "" : "tracking-[0.35em] uppercase"
            }`}
          >
            {t("registerEyebrow")}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-ivory">{t("registerTitle")}</h1>
          <p className="text-sm text-ivory-muted leading-relaxed">{t("registerSubtitle")}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-name" className="text-xs text-ivory-muted font-sans">
            {t("name")}
          </label>
          <input
            id="register-name"
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            className={authInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="text-xs text-ivory-muted font-sans">
            {t("email")}
          </label>
          <input
            id="register-email"
            required
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className={`${authInputClassName} text-start`}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-phone" className="text-xs text-ivory-muted font-sans">
            {t("phone")}
          </label>
          <PhoneInput
            id="register-phone"
            locale={locale}
            value={form.phone}
            onChange={(phone) => setForm({ ...form, phone })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="text-xs text-ivory-muted font-sans">
            {t("password")}
          </label>
          <PasswordField
            id="register-password"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            placeholder={t("passwordPlaceholder")}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            autoComplete="new-password"
          />
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="register-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              className="rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full min-h-[50px] overflow-hidden rounded-sm bg-gold text-[#0E0D12] font-sans text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_28px_rgba(201,168,76,0.28)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">{loading ? t("loading") : t("register")}</span>
          <span className="absolute inset-0 bg-ivory scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100 group-disabled:scale-x-0" />
        </button>

        <p className="text-sm text-ivory-muted text-center pt-1">
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-gold hover:underline underline-offset-4">
            {t("login")}
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  );
}
