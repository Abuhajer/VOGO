"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ORDER_STATUS_PIPELINE, getPipelineStepIndex } from "@/lib/order-status";
import { OrderStatus } from "@/types/db";

type OrderStatusStepperProps = {
  status: string;
  statusLabels: Record<string, string>;
  compact?: boolean;
};

export default function OrderStatusStepper({
  status,
  statusLabels,
  compact = false,
}: OrderStatusStepperProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const isCancelled = status === OrderStatus.CANCELLED;
  const currentIndex = getPipelineStepIndex(status);

  if (isCancelled) {
    return (
      <div className="rounded-sm border border-red-400/25 bg-red-500/8 px-4 py-3 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-red-300 text-sm">
          ✕
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-red-300/90 font-semibold">
            {statusLabels.CANCELLED}
          </p>
          <p className="text-[11px] text-red-200/70 mt-0.5">
            {isRtl ? "تم إلغاء هذا الطلب" : "This order was cancelled"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol
      className={`flex w-full ${compact ? "gap-0" : "gap-1"} items-start`}
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={isRtl ? "مسار حالة الطلب" : "Order status progress"}
    >
      {ORDER_STATUS_PIPELINE.map((step, index) => {
        const done = currentIndex > index;
        const active = currentIndex === index;
        const upcoming = currentIndex < index;
        const label = statusLabels[step] ?? step;

        return (
          <li
            key={step}
            className={`relative flex flex-1 flex-col items-center min-w-0 ${index < ORDER_STATUS_PIPELINE.length - 1 ? "" : ""}`}
          >
            {index < ORDER_STATUS_PIPELINE.length - 1 ? (
              <span
                aria-hidden
                className={`absolute top-[15px] h-px ${
                  isRtl ? "right-[calc(50%+16px)] left-0" : "left-[calc(50%+16px)] right-0"
                } ${done ? "bg-gold/60" : "bg-gold-glow/25"}`}
              />
            ) : null}

            <div className="relative z-[1] flex flex-col items-center gap-1.5 w-full px-0.5">
              <motion.span
                layout
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300 ${
                  done
                    ? "border-gold/50 bg-gold/20 text-gold"
                    : active
                      ? "border-gold bg-gold/15 text-gold shadow-[0_0_0_3px_rgba(201,168,76,0.15)]"
                      : "border-gold-glow/20 bg-void/80 text-ivory-faint"
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M2.5 7.2 5.8 10.5 11.5 3.8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </motion.span>
              <span
                className={`order-status-stepper__label text-center leading-tight ${
                  compact ? "text-[9px]" : "text-[9px] sm:text-[10px]"
                } uppercase tracking-wide w-full px-0.5 ${
                  active ? "is-active text-gold font-semibold" : done ? "text-ivory-muted" : "text-ivory-faint"
                }`}
                title={label}
              >
                {label}
              </span>
            </div>

            {active && !compact ? (
              <motion.span
                layoutId={`active-pip-${step}`}
                className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold"
                aria-hidden
              />
            ) : null}

            {upcoming ? <span className="sr-only">{label}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
