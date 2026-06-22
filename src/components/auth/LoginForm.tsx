"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AnimatePresence, motion } from "framer-motion";
import AuthShell from "@/components/auth/AuthShell";
import { authInputClassName } from "@/components/auth/authInputClassName";
import PasswordField from "@/components/auth/PasswordField";
import { useAppToast } from "@/hooks/useAppToast";

export default function LoginForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isArabic = locale === "ar";
  const { loginSuccess } = useAppToast();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error || result.ok === false) {
      setError(t("invalidCredentials"));
      return;
    }

    loginSuccess();

    const sessionRes = await fetch("/api/auth/session");
    const session = sessionRes.ok ? await sessionRes.json() : null;
    router.push(session?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <AuthShell mode="login">
      <motion.form
        onSubmit={handleSubmit}
        className="relative space-y-5 rounded-sm border border-gold-glow/20 bg-obsidian/80 p-8 md:p-10 backdrop-blur-sm shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        dir={isArabic ? "rtl" : "ltr"}
        animate={error ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="space-y-2 pb-2">
          <p
            className={`text-gold text-[11px] font-sans ${
              isArabic ? "" : "tracking-[0.35em] uppercase"
            }`}
          >
            {t("loginEyebrow")}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-ivory">{t("loginTitle")}</h1>
          <p className="text-sm text-ivory-muted leading-relaxed">{t("loginSubtitle")}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-email" className="text-xs text-ivory-muted font-sans">
            {t("email")}
          </label>
          <input
            id="login-email"
            required
            type="email"
            dir="ltr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className={`${authInputClassName} text-start`}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-xs text-ivory-muted font-sans">
            {t("password")}
          </label>
          <PasswordField
            id="login-password"
            value={password}
            onChange={setPassword}
            placeholder={t("passwordPlaceholder")}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="login-error"
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
          <span className="relative z-10">{loading ? t("loading") : t("login")}</span>
          <span className="absolute inset-0 bg-ivory scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100 group-disabled:scale-x-0" />
        </button>

        <p className="text-sm text-ivory-muted text-center pt-1">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-gold hover:underline underline-offset-4">
            {t("register")}
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  );
}
