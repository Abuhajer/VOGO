"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  type AdminAvatar,
  type AvatarFormInput,
  upsertAvatar,
} from "@/server/fitting-room-avatars";
import { emptyAvatarForm, slugifyAvatarName } from "@/lib/admin-avatars";
import Button from "@/components/ui/Button";

type AvatarFormModalProps = {
  open: boolean;
  avatar: AdminAvatar | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: (avatar: AdminAvatar) => void;
  onError: (key: string) => void;
};

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] uppercase tracking-wider text-ivory-faint">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-ivory-faint/80">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full bg-void border border-gold-glow/20 rounded-sm px-4 py-3 text-sm text-ivory placeholder:text-ivory-faint/60 focus:outline-none focus:border-gold/50 transition-colors";

export default function AvatarFormModal({
  open,
  avatar,
  nextSortOrder,
  onClose,
  onSaved,
  onError,
}: AvatarFormModalProps) {
  const t = useTranslations("Admin.Avatars");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<AvatarFormInput>(emptyAvatarForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (avatar) {
      setForm({
        slug: avatar.slug,
        labelEn: avatar.labelEn,
        labelAr: avatar.labelAr,
        imageSrc: avatar.imageSrc,
        sortOrder: avatar.sortOrder,
        active: avatar.active,
      });
      setSlugEdited(true);
      return;
    }

    setForm({
      ...emptyAvatarForm,
      sortOrder: nextSortOrder,
    });
    setSlugEdited(false);
  }, [open, avatar, nextSortOrder]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function updateField<K extends keyof AvatarFormInput>(key: K, value: AvatarFormInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "labelEn" && !slugEdited && typeof value === "string") {
        next.slug = slugifyAvatarName(value);
      }

      return next;
    });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/avatars/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        onError("upload");
        return;
      }
      updateField("imageSrc", data.url);
    } catch {
      onError("upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const result = await upsertAvatar(avatar ? { ...form, id: avatar.id } : form);
    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved(result.avatar);
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#050508]/85 backdrop-blur-sm"
            onClick={onClose}
            aria-label={t("cancel")}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-sm sm:rounded-sm border border-gold-glow/20 bg-obsidian shadow-2xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="sticky top-0 z-10 border-b border-gold-glow/10 bg-obsidian/95 px-6 py-4 backdrop-blur-sm">
              <h2 className="font-serif text-2xl text-ivory">
                {avatar ? t("editAvatar") : t("newAvatarTitle")}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`${formId}-labelEn`} label={t("labelEn")}>
                  <input
                    id={`${formId}-labelEn`}
                    required
                    value={form.labelEn}
                    onChange={(event) => updateField("labelEn", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field id={`${formId}-labelAr`} label={t("labelAr")}>
                  <input
                    id={`${formId}-labelAr`}
                    required
                    value={form.labelAr}
                    onChange={(event) => updateField("labelAr", event.target.value)}
                    className={inputClass}
                    dir="rtl"
                  />
                </Field>
              </div>

              <Field id={`${formId}-slug`} label={t("slug")}>
                <input
                  id={`${formId}-slug`}
                  required
                  value={form.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    updateField("slug", slugifyAvatarName(event.target.value));
                  }}
                  className={inputClass}
                  dir="ltr"
                />
              </Field>

              <Field id={`${formId}-imageSrc`} label={t("imageSrc")} hint={t("imageHint")}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUpload(file);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs border border-gold-glow/25 rounded-sm text-ivory hover:text-gold disabled:opacity-50"
                  >
                    {uploading ? t("uploading") : t("uploadImage")}
                  </button>
                </div>
                <input
                  value={form.imageSrc}
                  onChange={(event) => updateField("imageSrc", event.target.value)}
                  className={`${inputClass} mt-2`}
                  dir="ltr"
                  placeholder="/fitting-room/avatars/model.jpg"
                  required
                />
              </Field>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative w-full sm:w-32 aspect-[9/16] rounded-sm overflow-hidden border border-gold-glow/15 bg-void shrink-0">
                  {form.imageSrc ? (
                    <Image
                      src={form.imageSrc}
                      alt={form.labelEn || t("preview")}
                      fill
                      sizes="128px"
                      className="object-cover object-top"
                      unoptimized={form.imageSrc.startsWith("data:")}
                    />
                  ) : null}
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <Field id={`${formId}-sortOrder`} label={t("sortOrder")}>
                    <input
                      id={`${formId}-sortOrder`}
                      type="number"
                      min={0}
                      max={9999}
                      value={form.sortOrder}
                      onChange={(event) => updateField("sortOrder", Number(event.target.value))}
                      className={inputClass}
                      dir="ltr"
                    />
                  </Field>
                  <label className="inline-flex items-center gap-3 text-sm text-ivory">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) => updateField("active", event.target.checked)}
                      className="h-4 w-4 accent-gold"
                    />
                    {t("activeLabel")}
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gold-glow/10">
                <Button type="button" variant="outline" onClick={onClose} isArabic={isArabic}>
                  {t("cancel")}
                </Button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm font-sans text-xs font-semibold transition-all duration-300 bg-gold text-[#0E0D12] hover:shadow-[0_0_25px_rgba(201,168,76,0.3)] disabled:opacity-60"
                >
                  {saving ? t("saving") : t("saveAvatar")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
