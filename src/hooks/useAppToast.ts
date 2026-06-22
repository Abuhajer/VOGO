"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

const SUBTLE_DURATION = 2200;

export function useAppToast() {
  const t = useTranslations("Toast");

  return {
    cartAdded(product: string) {
      toast.success(t("addedToCart", { product }));
    },
    cartRemoved() {
      toast(t("removedFromCart"), { duration: SUBTLE_DURATION });
    },
    quantityUpdated() {
      toast(t("quantityUpdated"), { duration: SUBTLE_DURATION });
    },
    newsletterSuccess() {
      toast.success(t("newsletterSuccess"));
    },
    newsletterError() {
      toast.error(t("newsletterError"));
    },
    checkoutError(message: string) {
      toast.error(message);
    },
    loginSuccess() {
      toast.success(t("loginSuccess"));
    },
    registerSuccess() {
      toast.success(t("registerSuccess"));
    },
    fittingRoomSuccess() {
      toast.success(t("fittingRoomSuccess"));
    },
    fittingRoomError(message: string) {
      toast.error(message);
    },
    adminSuccess(message: string) {
      toast.success(message);
    },
    adminError(message: string) {
      toast.error(message);
    },
  };
}
