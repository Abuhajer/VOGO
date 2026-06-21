"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { FittingRoomProduct } from "@/lib/try-on/types";
import { localizeProduct } from "@/lib/products";
import ProductPicker from "./ProductPicker";
import PhotoCapture from "./PhotoCapture";
import ProcessingAnimation from "./ProcessingAnimation";
import ResultReveal from "./ResultReveal";
import FittingRoomStepper, { type FittingRoomStepKey } from "./FittingRoomStepper";
import FittingRoomStepIntro from "./FittingRoomStepIntro";
import Button from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Step = "product" | "photo" | "processing" | "result";

type Props = {
  products: FittingRoomProduct[];
  initialProductSlug?: string | null;
  apiConfigured: boolean;
};

export default function FittingRoomClient({
  products,
  initialProductSlug,
  apiConfigured,
}: Props) {
  const t = useTranslations("FittingRoom");
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const preselected = useMemo(() => {
    const slug = initialProductSlug ?? searchParams.get("product");
    if (!slug) return null;
    return products.find((p) => p.slug === slug) ?? null;
  }, [products, initialProductSlug, searchParams]);

  const [step, setStep] = useState<Step>(preselected ? "photo" : "product");
  const [selectedProduct, setSelectedProduct] = useState<FittingRoomProduct | null>(
    () => preselected ?? products[0] ?? null
  );
  const [personImageUrl, setPersonImageUrl] = useState<string | null>(null);
  const [personImageSize, setPersonImageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!personImageUrl) {
      setPersonImageSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setPersonImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = personImageUrl;
  }, [personImageUrl]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const mapGenerateError = useCallback(
    (data: { code?: string; retryAfterSeconds?: number; error?: string }) => {
      if (data.code === "QUOTA_EXCEEDED") {
        const wait = data.retryAfterSeconds ?? 3600;
        setCooldownSeconds(Math.min(wait, 120));
        return t("quotaExceeded");
      }
      if (data.code === "RATE_LIMIT" || data.error?.includes("429")) {
        const wait = data.retryAfterSeconds ?? 60;
        setCooldownSeconds(wait);
        return t("rateLimit", { seconds: wait });
      }
      return data.error ?? t("generateFailed");
    },
    [t]
  );

  const goToStep = (next: Step) => {
    startTransition(() => setStep(next));
  };

  const reachableSteps = useMemo((): FittingRoomStepKey[] => {
    const steps: FittingRoomStepKey[] = ["product"];
    if (selectedProduct) steps.push("photo");
    if (resultUrl && personImageUrl && selectedProduct) steps.push("result");
    return steps;
  }, [selectedProduct, resultUrl, personImageUrl]);

  const handleStepClick = useCallback(
    (target: FittingRoomStepKey) => {
      if (target === "processing" || target === step) return;
      if (!reachableSteps.includes(target)) return;
      goToStep(target);
    },
    [step, reachableSteps]
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedProduct || !personImageUrl) return;
    if (!apiConfigured) {
      setError(t("apiNotConfigured"));
      return;
    }

    setError(null);
    setGenerating(true);
    goToStep("processing");

    try {
      const res = await fetch("/api/fitting-room/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageUrl,
          productId: selectedProduct.id,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        width?: number;
        height?: number;
        personWidth?: number;
        personHeight?: number;
        error?: string;
        code?: string;
        retryAfterSeconds?: number;
      };
      if (!res.ok || !data.url) {
        setError(mapGenerateError(data));
        goToStep("photo");
        return;
      }
      setResultUrl(data.url);
      const lockW = data.personWidth ?? data.width;
      const lockH = data.personHeight ?? data.height;
      if (lockW && lockH) {
        setResultSize({ width: lockW, height: lockH });
      } else {
        setResultSize(null);
      }
      goToStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generateFailed"));
      goToStep("photo");
    } finally {
      setGenerating(false);
    }
  }, [selectedProduct, personImageUrl, apiConfigured, t, mapGenerateError]);

  const selectedName = selectedProduct
    ? localizeProduct(selectedProduct, locale).name
    : null;

  const isResult = step === "result";
  const isProductStep = step === "product";
  const isPhotoStep = step === "photo";
  const isProcessingStep = step === "processing";
  const isImmersiveStep = isProductStep || isPhotoStep || isProcessingStep;
  const isFullBleedStep = isImmersiveStep || isResult;
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden ${
        isFullBleedStep
          ? "max-w-none px-0 pb-0 pt-1"
          : "max-w-[1440px] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-6 lg:px-10 xl:px-12"
      }`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <header
        className={`relative z-20 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between md:items-center md:gap-4 ${
          isImmersiveStep || isResult
            ? "mb-1 px-3 sm:px-4 md:px-5"
            : "mb-3 sm:mb-3 md:mb-4"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[8px] uppercase tracking-[0.3em] text-gold sm:text-[9px] sm:tracking-[0.35em]">
            {t("eyebrow")}
          </p>
          <h1 className="truncate font-serif text-xl text-ivory sm:text-2xl md:text-3xl lg:text-[2rem]">
            {t("title")}
          </h1>
          {selectedName && step !== "product" ? (
            <p className="mt-0.5 truncate text-[11px] text-ivory-muted sm:text-xs">{selectedName}</p>
          ) : null}
        </div>
        <FittingRoomStepper
          current={step}
          compact
          reachableSteps={reachableSteps}
          onStepClick={handleStepClick}
        />
      </header>

      {!apiConfigured ? (
        <div
          role="alert"
          className={`shrink-0 rounded-sm border border-gold/30 bg-gold/5 px-4 py-2.5 text-xs text-gold ${
            isImmersiveStep ? "mx-3 mb-2 sm:mx-4" : "mb-3"
          }`}
        >
          {t("apiNotConfigured")}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className={`shrink-0 rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300 ${
            isImmersiveStep ? "mx-3 mb-2 sm:mx-4" : "mb-3"
          }`}
        >
          {error}
        </div>
      ) : null}

      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface/50 backdrop-blur-sm ${
          isFullBleedStep
            ? "rounded-none border-y border-gold-glow/15 shadow-none"
            : "rounded-sm border border-gold-glow/15 shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
        }`}
      >
        {(isProductStep || isPhotoStep) ? (
          <FittingRoomStepIntro
            step={isPhotoStep ? "photo" : "product"}
            variant={isPhotoStep ? "stacked" : "overlay"}
            showCarouselHint={isProductStep && !prefersReducedMotion && products.length > 0}
          />
        ) : null}

        <div
          className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain ${
            isResult
              ? "flex min-h-0 flex-1 flex-col p-0"
              : isPhotoStep
                ? "flex min-h-0 flex-1 flex-col p-0"
                : isProcessingStep
                  ? "flex min-h-0 flex-1 flex-col p-0"
                  : isProductStep
                  ? "flex min-h-0 flex-1 flex-col p-0"
                  : "p-3 sm:p-5 md:p-6 lg:p-8"
          }`}
        >
          <div
            key={step}
            className={
              isProductStep || isPhotoStep || isProcessingStep || isResult
                ? "flex min-h-0 flex-1 animate-fade-in flex-col"
                : "animate-fade-in"
            }
          >
            {step === "product" ? (
              <ProductPicker
                products={products}
                selectedId={selectedProduct?.id ?? null}
                onSelect={setSelectedProduct}
              />
            ) : null}

            {step === "photo" && selectedProduct ? (
              <PhotoCapture
                personImageUrl={personImageUrl}
                onPersonImageChange={setPersonImageUrl}
                onError={setError}
              />
            ) : null}

            {step === "processing" ? (
              <ProcessingAnimation product={selectedProduct} personImageUrl={personImageUrl} />
            ) : null}

            {step === "result" && selectedProduct && personImageUrl && resultUrl ? (
              <ResultReveal
                beforeUrl={personImageUrl}
                afterUrl={resultUrl}
                frameWidth={resultSize?.width ?? personImageSize?.width}
                frameHeight={resultSize?.height ?? personImageSize?.height}
                product={selectedProduct}
                onTryAnother={() => {
                  goToStep("product");
                  setResultUrl(null);
                  setResultSize(null);
                  setError(null);
                }}
                onStartOver={() => {
                  setStep("product");
                  setSelectedProduct(products[0] ?? null);
                  setPersonImageUrl(null);
                  setResultUrl(null);
                  setResultSize(null);
                  setError(null);
                }}
              />
            ) : null}
          </div>
        </div>

        {step !== "processing" && step !== "result" ? (
          <div
            className={`relative z-20 flex shrink-0 items-center justify-between gap-3 border-t border-gold-glow/10 bg-surface/95 backdrop-blur-md pb-[max(0.625rem,env(safe-area-inset-bottom))] ${
              isImmersiveStep
                ? "px-3 py-2 sm:px-5 sm:py-2.5"
                : "px-3 py-2.5 sm:px-5 sm:py-3 md:px-6 lg:px-8"
            }`}
          >
            {step === "photo" ? (
              <Button
                variant="ghost"
                onClick={() => goToStep("product")}
                isArabic={isAr}
                className="!min-h-11 !px-4 !py-2.5"
              >
                {t("back")}
              </Button>
            ) : (
              <span />
            )}

            {step === "product" ? (
              <Button
                variant="solid"
                disabled={!selectedProduct}
                onClick={() => goToStep("photo")}
                isArabic={isAr}
                className="!min-h-11 !px-5 !py-2.5 ms-auto"
              >
                {t("continue")}
              </Button>
            ) : null}

            {step === "photo" ? (
              <Button
                variant="solid"
                disabled={!personImageUrl || generating || !apiConfigured || cooldownSeconds > 0}
                onClick={() => void handleGenerate()}
                isArabic={isAr}
                className="!min-h-11 !px-5 !py-2.5"
              >
                {generating
                  ? t("generating")
                  : cooldownSeconds > 0
                    ? t("retryIn", { seconds: cooldownSeconds })
                    : t("generate")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
