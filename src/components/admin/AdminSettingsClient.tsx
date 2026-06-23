"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  setTryOnImageProvider,
  type TryOnSettingsSnapshot,
} from "@/server/try-on-settings";
import type { AdminTryOnProvider } from "@/lib/try-on/providers/types";
import Button from "@/components/ui/Button";

type AdminSettingsClientProps = {
  settings: TryOnSettingsSnapshot;
};

export default function AdminSettingsClient({ settings: initial }: AdminSettingsClientProps) {
  const t = useTranslations("Admin.Settings");
  const [settings, setSettings] = useState(initial);
  const [provider, setProvider] = useState<AdminTryOnProvider>(initial.provider);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await setTryOnImageProvider(provider);
      if (!result.ok) {
        showToast(t("error"));
        return;
      }
      setSettings(result.settings);
      setProvider(result.settings.provider);
      showToast(t("saved"));
    } finally {
      setSaving(false);
    }
  }

  const dirty = provider !== settings.provider;

  return (
    <div className="space-y-8 max-w-2xl">
      {toast ? (
        <div className="rounded-sm border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {toast}
        </div>
      ) : null}

      <section className="rounded-sm border border-gold-glow/15 bg-charcoal/40 p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg text-ivory">{t("tryOnTitle")}</h2>
          <p className="text-sm text-ivory-muted mt-1">{t("tryOnSubtitle")}</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="sr-only">{t("tryOnTitle")}</legend>
          {(["gemini", "local"] as const).map((value) => (
            <label
              key={value}
              className={`flex items-start gap-3 rounded-sm border p-4 cursor-pointer transition-colors ${
                provider === value
                  ? "border-gold/40 bg-gold/5"
                  : "border-gold-glow/10 hover:border-gold/20"
              }`}
            >
              <input
                type="radio"
                name="tryOnProvider"
                value={value}
                checked={provider === value}
                onChange={() => setProvider(value)}
                className="mt-1 accent-gold"
              />
              <span>
                <span className="block text-sm font-medium text-ivory">
                  {value === "gemini" ? t("providerGemini") : t("providerLocal")}
                </span>
                <span className="block text-xs text-ivory-muted mt-1">
                  {value === "gemini" ? t("providerGeminiHint") : t("providerLocalHint")}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </section>

      <section className="rounded-sm border border-gold-glow/15 bg-charcoal/30 p-6 space-y-3 text-sm">
        <h3 className="font-display text-base text-ivory">{t("statusTitle")}</h3>
        <ul className="space-y-2 text-ivory-muted">
          <li>
            <span className="text-ivory">{t("activeProvider")}:</span>{" "}
            {settings.provider === "local" ? t("providerLocal") : t("providerGemini")}
            <span className="text-xs ms-2 opacity-70">({settings.source})</span>
          </li>
          <li>
            <span className="text-ivory">Gemini:</span>{" "}
            {settings.geminiConfigured ? t("configured") : t("notConfigured")}
          </li>
          <li>
            <span className="text-ivory">ComfyUI:</span>{" "}
            {settings.localConfigured ? settings.comfyBaseUrl : t("notConfigured")}
            {settings.localConfigured ? (
              <span
                className={`ms-2 text-xs ${settings.comfyReachable ? "text-success" : "text-warning"}`}
              >
                {settings.comfyReachable ? t("reachable") : t("unreachable")}
              </span>
            ) : null}
          </li>
          {settings.localConfigured && !settings.comfyReachable ? (
            <li className="text-xs text-amber-400/90">{settings.comfyStatusMessage}</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
