"use client";

import { Component, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { PrimeMarkIcon } from "@/components/icons/Icons";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Error");
  const locale = useLocale();
  const router = useRouter();

  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center bg-void px-6 text-center"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <PrimeMarkIcon size={28} className="text-gold mb-4" />
      <h1 className="text-xl font-serif text-ivory mb-2">{t("title")}</h1>
      <p className="text-sm text-ivory-muted mb-6 max-w-md">{t("description")}</p>
      <button
        type="button"
        onClick={() => {
          onRetry();
          router.push("/");
        }}
        className="px-6 py-3 bg-gold text-[#0E0D12] text-xs font-semibold uppercase tracking-wider rounded-sm"
      >
        {t("cta")}
      </button>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback onRetry={() => this.setState({ hasError: false })} />
      );
    }

    return this.props.children;
  }
}
