"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import PhoneInput from "@/components/form/PhoneInput";
import { authInputClassName } from "@/components/auth/authInputClassName";
import { removeAccountAvatar, updateAccountProfile, changeAccountPassword } from "@/server/profile";
import PasswordField from "@/components/auth/PasswordField";
import { useAppToast } from "@/hooks/useAppToast";
import type { AccountDashboardData } from "@/types/dashboard";

type AccountProfileFormProps = {
  user: AccountDashboardData["user"];
  onProfileSaved: (user: AccountDashboardData["user"]) => void;
};

function formatMemberDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function AccountProfileForm({ user, onProfileSaved }: AccountProfileFormProps) {
  const t = useTranslations("Account.profile");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { update: updateSession } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const { profileSaved, profileError } = useAppToast();

  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [preferredLocale, setPreferredLocale] = useState<"ar" | "en">(
    (user.preferredLocale === "en" ? "en" : "ar") as "ar" | "en"
  );
  const [image, setImage] = useState<string | null>(user.image);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const displayName = name.trim() || user.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: form });
      if (!res.ok) {
        profileError(t("avatarError"));
        return;
      }
      const { url } = (await res.json()) as { url: string };
      setImage(url);

      onProfileSaved({
        ...user,
        image: url,
      });
      await updateSession({ image: url });
      profileSaved();
    } catch {
      profileError(t("avatarError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    try {
      const result = await removeAccountAvatar();
      if (!result.ok) {
        profileError(t("saveError"));
        return;
      }
      setImage(null);
      onProfileSaved({
        ...user,
        image: null,
      });
      await updateSession({ image: null });
      profileSaved();
    } catch {
      profileError(t("saveError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;

    setSaving(true);
    try {
      const result = await updateAccountProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        preferredLocale,
      });

      if (!result.ok) {
        profileError(
          result.error === "validation"
            ? t("validationError")
            : result.error === "unauthorized"
              ? t("unauthorizedError")
              : t("saveError")
        );
        return;
      }

      const updatedUser: AccountDashboardData["user"] = {
        ...user,
        name: result.profile.name,
        phone: result.profile.phone,
        preferredLocale: result.profile.preferredLocale,
        image: result.profile.image,
      };
      onProfileSaved(updatedUser);
      await updateSession({
        name: result.profile.name ?? undefined,
        image: result.profile.image,
      });
      profileSaved();

      if (preferredLocale !== locale) {
        router.replace(pathname, { locale: preferredLocale });
      } else {
        router.refresh();
      }
    } catch {
      profileError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);

    const result = await changeAccountPassword({
      currentPassword,
      newPassword,
    });

    setPasswordSaving(false);

    if (!result.ok) {
      setPasswordError(
        result.error === "wrong_password"
          ? t("passwordWrong")
          : result.error === "no_password"
            ? t("passwordOAuth")
            : t("passwordError")
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    profileSaved();
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-sm border border-gold-glow/15 bg-obsidian/60 p-6 md:p-8">
        <h2 className="font-serif text-xl text-ivory">{t("title")}</h2>
        <p className="mt-1 text-sm text-ivory-muted">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="relative">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className="h-24 w-24 rounded-full border border-gold/30 object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-serif text-3xl text-gold">
                  {initial}
                </span>
              )}
              {uploading ? (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-void/70">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                </span>
              ) : null}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleAvatarUpload(file);
                event.target.value = "";
              }}
            />

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="rounded-sm border border-gold/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
              >
                {t("changePhoto")}
              </button>
              {image ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void handleRemoveAvatar()}
                  className="text-[10px] uppercase tracking-[0.12em] text-ivory-faint transition-colors hover:text-gold disabled:opacity-50"
                >
                  {t("removePhoto")}
                </button>
              ) : null}
            </div>
            <p className="max-w-[12rem] text-center text-[10px] leading-relaxed text-ivory-faint sm:text-start">
              {t("photoHint")}
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-gold">
                {t("fullName")}
              </label>
              <input
                id="profile-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={authInputClassName}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-gold">
                {t("email")}
              </label>
              <input
                id="profile-email"
                type="email"
                readOnly
                value={user.email ?? ""}
                className={`${authInputClassName} cursor-not-allowed opacity-70`}
              />
              <p className="mt-1 text-[10px] text-ivory-faint">{t("emailHint")}</p>
            </div>

            <div>
              <label htmlFor="profile-phone" className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-gold">
                {t("phone")}
              </label>
              <PhoneInput
                id="profile-phone"
                value={phone}
                onChange={setPhone}
                locale={locale}
                required={false}
              />
            </div>

            <div>
              <label
                htmlFor="profile-locale"
                className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-gold"
              >
                {t("preferredLanguage")}
              </label>
              <select
                id="profile-locale"
                value={preferredLocale}
                onChange={(event) => setPreferredLocale(event.target.value as "ar" | "en")}
                className={authInputClassName}
              >
                <option value="ar">{t("languageAr")}</option>
                <option value="en">{t("languageEn")}</option>
              </select>
              <p className="mt-1 text-[10px] text-ivory-faint">{t("languageHint")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-sm border border-gold-glow/10 bg-surface/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ivory-faint">
          {t("memberSince", { date: formatMemberDate(user.memberSince, locale) })}
        </p>
        <button
          type="submit"
          disabled={saving || uploading || name.trim().length < 2}
          className="inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#0E0D12] transition-shadow hover:shadow-[0_0_24px_rgba(201,168,76,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </form>

    {user.hasPassword ? (
      <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-6">
        <div className="rounded-sm border border-gold-glow/15 bg-obsidian/60 p-6 md:p-8">
          <h2 className="font-serif text-xl text-ivory">{t("passwordTitle")}</h2>
          <p className="mt-1 text-sm text-ivory-muted">{t("passwordSubtitle")}</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="current-password"
                className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-gold"
              >
                {t("currentPassword")}
              </label>
              <PasswordField
                id="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder={t("currentPasswordPlaceholder")}
                showLabel={t("showPassword")}
                hideLabel={t("hidePassword")}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-gold"
              >
                {t("newPassword")}
              </label>
              <PasswordField
                id="new-password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder={t("newPasswordPlaceholder")}
                showLabel={t("showPassword")}
                hideLabel={t("hidePassword")}
                autoComplete="new-password"
              />
            </div>
          </div>

          {passwordError ? (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {passwordError}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving || currentPassword.length < 8 || newPassword.length < 8}
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-gold/30 px-6 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordSaving ? t("passwordSaving") : t("updatePassword")}
            </button>
          </div>
        </div>
      </form>
    ) : (
      <div className="mt-8 rounded-sm border border-gold-glow/10 bg-surface/20 px-5 py-4">
        <p className="text-sm text-ivory-muted">{t("passwordOAuthHint")}</p>
      </div>
    )}
    </>
  );
}
