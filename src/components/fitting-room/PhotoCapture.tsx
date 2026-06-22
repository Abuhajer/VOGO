"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { capturePortrait9x16FromVideo } from "@/lib/captureVideoFrame";
import {
  preparePortraitBlob,
  uploadPortraitBlob,
  uploadPortraitDataUrl,
} from "@/lib/fitting-room/preparePortrait";
import AvatarPicker from "./AvatarPicker";
import FittingRoomStepIntro from "./FittingRoomStepIntro";

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

function PortraitPlaceholder({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="fitting-room-portrait-empty absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center sm:gap-4 sm:px-8">
      <div className="relative flex h-[min(42%,9.5rem)] w-[min(58%,7rem)] items-center justify-center rounded-sm border border-dashed border-gold/28 bg-gold/[0.03] sm:h-[min(44%,10.5rem)] sm:w-[min(60%,7.5rem)]">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold/90 sm:h-12 sm:w-12">
          {icon}
        </span>
      </div>
      <div className="max-w-[15rem] space-y-1.5">
        <p className="text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ivory/85 sm:text-[11px]">
          {title}
        </p>
        {subtitle ? (
          <p className="text-[10px] leading-relaxed text-ivory-faint sm:text-[11px]">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
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
  layout: "horizontal" | "compact";
}) {
  if (layout === "compact") {
    return (
      <div
        className="fitting-room-source-tabs-compact inline-flex w-full max-w-full flex-wrap gap-1 rounded-sm border border-gold-glow/12 bg-void/50 p-1 backdrop-blur-sm light:bg-surface/70"
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
              className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-[2px] px-2.5 py-1.5 transition-all duration-200 motion-reduce:transition-none ${
                active
                  ? "bg-gold/14 text-gold shadow-[inset_0_0_0_1px_rgba(201,168,76,0.28)]"
                  : "text-ivory-faint hover:bg-surface/30 hover:text-ivory-muted"
              }`}
            >
              <SourceIcon id={tab.id} size={13} />
              <span className="truncate text-[8px] uppercase tracking-[0.1em] sm:text-[9px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="fitting-room-source-tabs-h flex w-full shrink-0 gap-1 rounded-sm border border-gold-glow/12 bg-void/60 p-1 backdrop-blur-sm light:bg-surface/80"
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
            className={`relative flex min-h-10 flex-1 flex-col items-center justify-center gap-0.5 rounded-[2px] px-1.5 py-1.5 transition-colors duration-200 motion-reduce:transition-none sm:min-h-11 ${
              active
                ? "bg-gold/12 text-gold shadow-[inset_0_0_0_1px_rgba(201,168,76,0.25)]"
                : "text-ivory-faint hover:bg-surface/35 hover:text-ivory-muted"
            }`}
          >
            <SourceIcon id={tab.id} size={14} />
            <span className="max-w-full truncate text-center text-[7px] uppercase leading-none tracking-[0.08em] sm:text-[8px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SourcePanel({
  source,
  uploading,
  cameraActive,
  cameraStarting,
  cameraFacing,
  isAr,
  t,
  onOpenFilePicker,
  onStartCamera,
  onSwitchCamera,
}: {
  source: PhotoSource;
  uploading: boolean;
  cameraActive: boolean;
  cameraStarting: boolean;
  cameraFacing: "user" | "environment";
  isAr: boolean;
  t: ReturnType<typeof useTranslations<"FittingRoom">>;
  onOpenFilePicker: () => void;
  onStartCamera: () => void;
  onSwitchCamera: () => void;
}) {
  if (source === "avatar") {
    return null;
  }

  return (
    <div className="space-y-2.5" dir={isAr ? "rtl" : "ltr"}>
      {source === "upload" ? (
        <>
          <p className="text-[9px] leading-relaxed text-ivory-muted">{t("step2Desc")}</p>
          <button
            type="button"
            disabled={uploading}
            onClick={onOpenFilePicker}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.06] px-3 text-[9px] uppercase tracking-[0.12em] text-gold transition-colors hover:border-gold/45 hover:bg-gold/[0.1] disabled:cursor-wait disabled:opacity-60"
          >
            <SourceIcon id="upload" size={13} />
            {uploading ? t("uploading") : t("dropPhoto")}
          </button>
        </>
      ) : null}

      {source === "camera" ? (
        <>
          <p className="text-[10px] leading-relaxed text-ivory-muted">{t("cameraIntro")}</p>
          {!cameraActive && !cameraStarting ? (
            <button
              type="button"
              onClick={onStartCamera}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.06] px-3 text-[9px] uppercase tracking-[0.12em] text-gold transition-colors hover:border-gold/45 hover:bg-gold/[0.1]"
            >
              <SourceIcon id="camera" size={13} />
              {t("enableCamera")}
            </button>
          ) : null}
          {cameraStarting ? (
            <p className="text-[10px] leading-relaxed text-ivory-faint">{t("cameraStarting")}</p>
          ) : null}
          {cameraActive ? (
            <>
              <p className="text-[10px] leading-relaxed text-ivory-faint">{t("frameGuide")}</p>
              <button
                type="button"
                onClick={onSwitchCamera}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border border-gold-glow/20 bg-void/50 px-3 text-[9px] uppercase tracking-[0.12em] text-ivory-muted transition-colors hover:border-gold/35 hover:text-gold"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M4.5 4.5H6L7 3H9L10 4.5H11.5C12.3284 4.5 13 5.17157 13 6V11C13 11.8284 12.3284 12.5 11.5 12.5H4.5C3.67157 12.5 3 11.8284 3 11V6C3 5.17157 3.67157 4.5 4.5 4.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <circle cx="8" cy="8.25" r="1.75" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                {t("switchCamera")} — {cameraFacing === "user" ? t("cameraFront") : t("cameraBack")}
              </button>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default function PhotoCapture({ personImageUrl, onPersonImageChange, onError }: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const prefersReducedMotion = useReducedMotion();
  const [source, setSource] = useState<PhotoSource>("upload");
  const [preview, setPreview] = useState<string | null>(personImageUrl);
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraDenied, setCameraDenied] = useState(false);
  const [, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraStoppedByUserRef = useRef(false);

  useEffect(() => {
    setPreview(personImageUrl);
  }, [personImageUrl]);

  const stopCamera = useCallback((byUser = false) => {
    if (byUser) cameraStoppedByUserRef.current = true;
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
    if (next === "camera") {
      setCameraDenied(false);
      cameraStoppedByUserRef.current = false;
    }
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

  const startCamera = useCallback(
    async (facing: "user" | "environment" = cameraFacing) => {
      stopCamera();
      onError(null);
      setCameraDenied(false);
      cameraStoppedByUserRef.current = false;
      setCameraStarting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setCameraFacing(facing);
        setCameraActive(true);
        const video = videoRef.current;
        if (video) {
          video.setAttribute("playsinline", "true");
          video.muted = true;
          video.srcObject = stream;
          await video.play();
        }
      } catch {
        setCameraDenied(true);
        onError(t("cameraDenied"));
      } finally {
        setCameraStarting(false);
      }
    },
    [cameraFacing, onError, stopCamera, t]
  );

  const switchCamera = useCallback(() => {
    const next = cameraFacing === "user" ? "environment" : "user";
    void startCamera(next);
  }, [cameraFacing, startCamera]);

  useEffect(() => {
    if (source !== "camera" || cameraDenied || cameraStoppedByUserRef.current) return;
    if (cameraActive || cameraStarting) return;
    void startCamera(cameraFacing);
  }, [source, cameraDenied, cameraActive, cameraStarting, cameraFacing, startCamera]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const mirror = cameraFacing === "user";
    const rotation =
      video.videoWidth > video.videoHeight ? 90 : 0;
    const dataUrl = capturePortrait9x16FromVideo(video, { mirror, rotation });
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
  const showAvatarEmpty = source === "avatar" && !preview;

  const previewLabel =
    source === "avatar" ? t("selectedModel") : source === "upload" ? t("yourPhoto") : t("yourPhoto");

  const portraitImgClass =
    source === "avatar"
      ? "fitting-room-portrait-img fitting-room-portrait-img--avatar"
      : "fitting-room-portrait-img fitting-room-portrait-img--photo";

  const previewTransition = prefersReducedMotion ? "" : "fitting-room-portrait-fade";

  const sourcePanel = (
    <SourcePanel
      source={source}
      uploading={uploading}
      cameraActive={cameraActive}
      cameraStarting={cameraStarting}
      cameraFacing={cameraFacing}
      isAr={isAr}
      t={t}
      onOpenFilePicker={openFilePicker}
      onStartCamera={() => void startCamera()}
      onSwitchCamera={switchCamera}
    />
  );

  const gridColsClass =
    source === "avatar"
      ? "md:grid-cols-[minmax(11rem,15rem)_auto_minmax(0,1fr)]"
      : "md:grid-cols-[minmax(11rem,15rem)_1fr]";

  return (
    <div className="fitting-room-photo-stage relative flex w-full flex-col md:min-h-0 md:flex-1">
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

      <div className="shrink-0 space-y-2 px-2 pt-1 md:hidden" dir={isAr ? "rtl" : "ltr"}>
        <FittingRoomStepIntro step="photo" variant="stacked" />
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
        className={`fitting-room-photo-row relative mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-3 px-2 py-2 sm:gap-4 sm:px-3 md:min-h-0 md:items-center md:gap-5 md:py-3 lg:gap-6 lg:px-5 ${gridColsClass}`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <aside className="fitting-room-photo-sidebar order-1 flex w-full min-w-0 shrink-0 flex-col md:max-w-[15rem] md:justify-self-stretch lg:max-w-[16rem]">
          <div className="hidden md:block">
            <FittingRoomStepIntro step="photo" variant="sidebar" />
            <p className="mb-2 mt-3 text-[8px] uppercase tracking-[0.2em] text-gold">{t("sourceLabel")}</p>
            <SourceTabs
              tabs={tabs}
              source={source}
              isAr={isAr}
              stepLabel={t("step2Title")}
              onSelect={switchSource}
              layout="compact"
            />
          </div>

          <div className="fitting-room-photo-panel mt-3 border-t border-gold-glow/10 pt-3 md:mt-3 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-y-contain md:pt-3">
            {sourcePanel}
          </div>
        </aside>

        <div className="fitting-room-portrait-frame fitting-room-portrait-frame--step2 relative order-2 mx-auto min-h-0 w-full min-w-0 shrink-0 justify-self-center">
          {showPortraitPreview ? (
            <>
              <Image
                key={preview}
                src={preview}
                alt={previewLabel}
                fill
                sizes="(max-width: 768px) 42vw, 420px"
                className={`${portraitImgClass} ${previewTransition}`}
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
                  className="absolute end-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-sm border border-gold/35 bg-void/90 text-gold shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors hover:border-gold/55 hover:bg-void disabled:cursor-wait disabled:opacity-60 light:shadow-[0_2px_10px_rgba(14,13,18,0.12)] sm:h-10 sm:w-10"
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
              className="absolute inset-0 cursor-pointer"
            >
              <PortraitPlaceholder
                icon={<SourceIcon id="upload" size={18} />}
                title={uploading ? t("uploading") : t("dropPhoto")}
                subtitle={t("portraitHint")}
              />
            </div>
          ) : null}

          {showCamera ? (
            <>
              <video
                ref={videoRef}
                className={`fitting-room-camera-feed absolute inset-0 h-full w-full ${
                  cameraActive ? "opacity-100" : "opacity-0"
                } ${cameraActive && cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
                playsInline
                muted
                autoPlay
              />
              {cameraActive ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_68%_72%_at_50%_42%,transparent_52%,rgba(5,5,8,0.55)_100%)] light:bg-[radial-gradient(ellipse_68%_72%_at_50%_42%,transparent_52%,rgba(14,13,18,0.18)_100%)]" />
                  <div className="fitting-room-camera-guide pointer-events-none absolute inset-[6%] rounded-sm border border-dashed border-gold/35 sm:inset-[8%]" />
                  <p className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-[8px] uppercase tracking-[0.15em] text-gold/90 sm:top-4 sm:text-[9px]">
                    {t("frameGuide")}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-void/95 via-void/70 to-transparent px-3 pb-4 pt-10 sm:gap-3 sm:pb-5">
                    <button
                      type="button"
                      onClick={() => stopCamera(true)}
                      className="min-h-10 rounded-sm border border-gold-glow/20 bg-void/80 px-2.5 text-[7px] uppercase tracking-[0.1em] text-ivory-muted backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-ivory sm:min-h-11 sm:px-3 sm:text-[8px]"
                    >
                      {t("stopCamera")}
                    </button>
                    <button
                      type="button"
                      onClick={switchCamera}
                      title={t("switchCamera")}
                      aria-label={`${t("switchCamera")} — ${cameraFacing === "user" ? t("cameraFront") : t("cameraBack")}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-gold-glow/25 bg-void/80 text-gold backdrop-blur-sm transition-colors hover:border-gold/40 sm:h-11 sm:w-11"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M4.5 4.5H6L7 3H9L10 4.5H11.5C12.3284 4.5 13 5.17157 13 6V11C13 11.8284 12.3284 12.5 11.5 12.5H4.5C3.67157 12.5 3 11.8284 3 11V6C3 5.17157 3.67157 4.5 4.5 4.5Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle cx="8" cy="8.25" r="1.75" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => void capturePhoto()}
                      disabled={uploading}
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold/20 shadow-[0_0_28px_rgba(201,168,76,0.3)] transition-transform hover:scale-[1.03] hover:bg-gold/35 active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:h-16 sm:w-16"
                      aria-label={t("capture")}
                    >
                      <span className="h-10 w-10 rounded-full border border-gold/60 bg-gold/25 sm:h-11 sm:w-11" />
                    </button>
                  </div>
                </>
              ) : (
                <PortraitPlaceholder
                  icon={<SourceIcon id="camera" size={18} />}
                  title={t("cameraIntro")}
                  action={
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      disabled={cameraStarting}
                      className="min-h-11 rounded-sm border border-gold/40 bg-gold/10 px-6 py-2.5 text-[9px] uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold/20 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:min-h-12 sm:px-8 sm:text-[10px]"
                    >
                      {cameraStarting ? t("cameraStarting") : t("enableCamera")}
                    </button>
                  }
                />
              )}
            </>
          ) : null}

          {showAvatarEmpty ? (
            <PortraitPlaceholder
              icon={<SourceIcon id="avatar" size={18} />}
              title={t("pickModel")}
              subtitle={t("portraitHint")}
            />
          ) : null}
        </div>

        {source === "avatar" ? (
          <section
            className="fitting-room-avatar-rail order-3 hidden min-h-0 min-w-0 md:flex md:flex-col md:justify-center md:ps-1 lg:ps-2"
            aria-label={t("avatarLabel")}
          >
            <AvatarPicker
              selectedSrc={preview}
              onSelect={selectAvatar}
              layout="sidebar"
              showHeader
            />
          </section>
        ) : null}
      </div>

      {source === "avatar" ? (
        <div className="shrink-0 px-2 pb-2 md:hidden" dir={isAr ? "rtl" : "ltr"}>
          <p className="mb-1.5 text-[8px] uppercase tracking-[0.2em] text-gold">{t("avatarLabel")}</p>
          <AvatarPicker
            selectedSrc={preview}
            onSelect={selectAvatar}
            layout="scroll"
            showHeader={false}
          />
        </div>
      ) : null}

      <p className="shrink-0 px-3 pb-2 pt-1 text-center text-[7px] leading-snug text-ivory-faint/85 sm:pb-3 sm:text-[8px]">
        {t("portraitHint")}
      </p>
    </div>
  );
}
