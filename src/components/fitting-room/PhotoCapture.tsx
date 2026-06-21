"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { capturePortrait9x16FromVideo } from "@/lib/captureVideoFrame";
import {
  preparePortraitBlob,
  uploadPortraitBlob,
  uploadPortraitDataUrl,
} from "@/lib/fitting-room/preparePortrait";
import AvatarPicker from "./AvatarPicker";

type PhotoSource = "upload" | "camera" | "avatar";

type Props = {
  personImageUrl: string | null;
  onPersonImageChange: (url: string | null) => void;
  onError: (message: string | null) => void;
};

function SourceIcon({ id, size = 16 }: { id: PhotoSource; size?: number }) {
  if (id === "upload") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 2V10M8 2L5.5 4.5M8 2L10.5 4.5M3 11V12.5C3 13.0523 3.44772 13.5 4 13.5H12C12.5523 13.5 13 13.0523 13 12.5V11"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "camera") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M2.5 5.5H4.5L5.5 4H10.5L11.5 5.5H13.5C14.0523 5.5 14.5 5.94772 14.5 6.5V12C14.5 12.5523 14.0523 13 13.5 13H2.5C1.94772 13 1.5 12.5523 1.5 12V6.5C1.5 5.94772 1.94772 5.5 2.5 5.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="9" r="2" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M3.5 13.5C3.5 11.0147 5.51472 9 8 9C10.4853 9 12.5 11.0147 12.5 13.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SourceTabs({
  tabs,
  source,
  isAr,
  stepLabel,
  onSelect,
  layout,
}: {
  tabs: { id: PhotoSource; label: string }[];
  source: PhotoSource;
  isAr: boolean;
  stepLabel: string;
  onSelect: (id: PhotoSource) => void;
  layout: "horizontal" | "vertical";
}) {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={
        isHorizontal
          ? "fitting-room-source-tabs-h flex w-full shrink-0 gap-1 rounded-sm border border-gold-glow/12 bg-void/60 p-1 backdrop-blur-sm"
          : "fitting-room-source-tabs flex w-11 shrink-0 flex-col gap-0.5 rounded-sm border border-gold-glow/12 bg-void/50 p-1 sm:w-12"
      }
      role="tablist"
      aria-label={stepLabel}
      dir={isAr ? "rtl" : "ltr"}
    >
      {tabs.map((tab) => {
        const active = source === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            onClick={() => onSelect(tab.id)}
            className={
              isHorizontal
                ? `relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-[2px] px-2 py-2 transition-colors duration-200 sm:min-h-12 ${
                    active
                      ? "bg-gold/12 text-gold shadow-[inset_0_0_0_1px_rgba(201,168,76,0.25)]"
                      : "text-ivory-faint hover:bg-surface/35 hover:text-ivory-muted"
                  }`
                : `relative flex min-h-[2.75rem] flex-col items-center justify-center gap-1 rounded-[2px] px-1 py-2 transition-colors duration-200 sm:min-h-[3rem] ${
                    active
                      ? "bg-gold/12 text-gold"
                      : "text-ivory-faint hover:bg-surface/35 hover:text-ivory-muted"
                  }`
            }
          >
            {!isHorizontal && active ? (
              <span className="absolute inset-y-1 start-0 w-px bg-gold/80" aria-hidden />
            ) : null}
            <SourceIcon id={tab.id} size={isHorizontal ? 16 : 15} />
            <span
              className={`max-w-full truncate text-center uppercase leading-none tracking-[0.08em] ${
                isHorizontal ? "text-[8px] sm:text-[9px]" : "text-[7px] sm:text-[8px]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function PhotoCapture({ personImageUrl, onPersonImageChange, onError }: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const [source, setSource] = useState<PhotoSource>("upload");
  const [preview, setPreview] = useState<string | null>(personImageUrl);
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(personImageUrl);
  }, [personImageUrl]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setCameraStarting(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const switchSource = (next: PhotoSource) => {
    if (next === source) return;
    startTransition(() => {
      setSource(next);
      if (next !== "camera") stopCamera();
    });
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    onError(null);
    try {
      const blob = await preparePortraitBlob(file);
      const url = await uploadPortraitBlob(blob);
      setPreview(url);
      onPersonImageChange(url);
      setSource("upload");
    } catch (err) {
      onError(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError(t("invalidFile"));
      return;
    }
    void uploadFile(file);
  };

  const startCamera = async () => {
    stopCamera();
    onError(null);
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      onError(t("cameraDenied"));
    } finally {
      setCameraStarting(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const dataUrl = capturePortrait9x16FromVideo(video, { mirror: true, rotation: 0 });
    if (!dataUrl) {
      onError(t("captureFailed"));
      return;
    }
    stopCamera();
    setUploading(true);
    onError(null);
    try {
      const url = await uploadPortraitDataUrl(dataUrl);
      setPreview(url);
      onPersonImageChange(url);
      setSource("upload");
    } catch (err) {
      onError(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const selectAvatar = (src: string) => {
    stopCamera();
    onError(null);
    setPreview(src);
    onPersonImageChange(src);
    setSource("avatar");
  };

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const tabs: { id: PhotoSource; label: string }[] = [
    { id: "upload", label: t("tabUpload") },
    { id: "camera", label: t("tabCamera") },
    { id: "avatar", label: t("tabAvatar") },
  ];

  const showPortraitPreview =
    preview && (source === "upload" || source === "avatar" || (source === "camera" && !cameraActive));
  const showUploadEmpty = source === "upload" && !preview;
  const showCamera = source === "camera";
  const showAvatarPanel = source === "avatar";

  const previewLabel =
    source === "avatar" ? t("selectedModel") : source === "upload" ? t("yourPhoto") : t("yourPhoto");

  return (
    <div className="fitting-room-photo-stage relative flex min-h-0 w-full flex-1 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="shrink-0 px-2 pt-1 md:hidden">
        <SourceTabs
          tabs={tabs}
          source={source}
          isAr={isAr}
          stepLabel={t("step2Title")}
          onSelect={switchSource}
          layout="horizontal"
        />
      </div>

      <div
        className="fitting-room-photo-row relative mx-auto flex min-h-0 w-full max-w-full flex-1 items-stretch justify-center gap-2 px-2 py-2 sm:gap-3 sm:px-3 md:items-center md:py-3"
        dir="ltr"
      >
        <div className="fitting-room-portrait-frame relative min-h-0 min-w-0 flex-1">
          {showPortraitPreview ? (
            <>
              <Image
                src={preview}
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 480px"
                className="fitting-room-portrait-img"
                unoptimized={
                  preview.startsWith("data:") ||
                  preview.startsWith("/uploads") ||
                  preview.endsWith(".svg")
                }
                priority
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 via-void/45 to-transparent px-3 pb-3 pt-10">
                <span className="text-[8px] uppercase tracking-[0.2em] text-gold sm:text-[9px]">
                  {previewLabel}
                </span>
              </div>
              {source === "upload" ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={openFilePicker}
                  title={uploading ? t("uploading") : t("reuploadPhoto")}
                  aria-label={uploading ? t("uploading") : t("reuploadPhoto")}
                  className="absolute end-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-sm border border-gold/35 bg-void/90 text-gold shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors hover:border-gold/55 hover:bg-void disabled:cursor-wait disabled:opacity-60 sm:h-10 sm:w-10"
                >
                  <SourceIcon id="upload" size={15} />
                </button>
              ) : null}
            </>
          ) : null}

          {showUploadEmpty ? (
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 transition-colors hover:bg-gold/[0.03]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold/85 sm:h-14 sm:w-14">
                <SourceIcon id="upload" size={18} />
              </span>
              <span className="max-w-[14rem] px-4 text-center text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ivory-faint sm:text-[11px]">
                {uploading ? t("uploading") : t("dropPhoto")}
              </span>
            </div>
          ) : null}

          {showCamera ? (
            <>
              <video
                ref={videoRef}
                className={`fitting-room-camera-feed absolute inset-0 h-full w-full ${
                  cameraActive ? "scale-x-[-1] opacity-100" : "opacity-0"
                }`}
                playsInline
                muted
              />
              {cameraActive ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_68%_72%_at_50%_42%,transparent_52%,rgba(5,5,8,0.55)_100%)]" />
                  <div className="fitting-room-camera-guide pointer-events-none absolute inset-[6%] rounded-sm border border-dashed border-gold/35 sm:inset-[8%]" />
                  <p className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-[8px] uppercase tracking-[0.15em] text-gold/90 sm:top-4 sm:text-[9px]">
                    {t("frameGuide")}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 bg-gradient-to-t from-void/95 via-void/70 to-transparent px-4 pb-4 pt-10 sm:gap-4 sm:pb-5">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="min-h-10 rounded-sm border border-gold-glow/20 bg-void/80 px-3 text-[8px] uppercase tracking-[0.12em] text-ivory-muted backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-ivory sm:min-h-11 sm:px-4 sm:text-[9px]"
                    >
                      {t("stopCamera")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void capturePhoto()}
                      disabled={uploading}
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold/20 shadow-[0_0_28px_rgba(201,168,76,0.3)] transition-transform hover:scale-[1.03] hover:bg-gold/35 active:scale-[0.97] disabled:opacity-50 sm:h-16 sm:w-16"
                      aria-label={t("capture")}
                    >
                      <span className="h-10 w-10 rounded-full border border-gold/60 bg-gold/25 sm:h-11 sm:w-11" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center sm:gap-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-gold sm:h-16 sm:w-16">
                    <SourceIcon id="camera" size={20} />
                  </span>
                  <p className="max-w-sm text-[11px] leading-relaxed text-ivory-muted sm:text-xs">
                    {t("cameraIntro")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    disabled={cameraStarting}
                    className="min-h-11 rounded-sm border border-gold/40 bg-gold/10 px-6 py-2.5 text-[9px] uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold/20 disabled:cursor-wait disabled:opacity-60 sm:min-h-12 sm:px-8 sm:text-[10px]"
                  >
                    {cameraStarting ? t("cameraStarting") : t("enableCamera")}
                  </button>
                </div>
              )}
            </>
          ) : null}

          {showAvatarPanel && !preview ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold/80">
                <SourceIcon id="avatar" size={18} />
              </span>
              <p className="max-w-xs text-[11px] leading-relaxed text-ivory-muted sm:text-xs">{t("pickModel")}</p>
            </div>
          ) : null}
        </div>

        <div className="hidden shrink-0 md:block">
          <SourceTabs
            tabs={tabs}
            source={source}
            isAr={isAr}
            stepLabel={t("step2Title")}
            onSelect={switchSource}
            layout="vertical"
          />
        </div>
      </div>

      {showAvatarPanel ? (
        <div className="fitting-room-avatar-panel shrink-0 border-t border-gold-glow/10 bg-void/40 px-2 pb-2 pt-2 sm:px-3 md:px-4">
          <div className="mb-2 hidden px-1 sm:block">
            <p className="text-[9px] uppercase tracking-[0.2em] text-gold">{t("avatarLabel")}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-ivory-muted sm:text-[11px]">{t("avatarHint")}</p>
          </div>
          <AvatarPicker selectedSrc={preview} onSelect={selectAvatar} compact />
        </div>
      ) : null}

      <p className="pointer-events-none shrink-0 px-3 pb-1 pt-1 text-center text-[8px] leading-snug text-ivory-faint/85 sm:pb-2 sm:text-[9px]">
        {t("portraitHint")}
      </p>
    </div>
  );
}
