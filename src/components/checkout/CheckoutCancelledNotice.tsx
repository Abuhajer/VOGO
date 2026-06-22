"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function CheckoutCancelledNotice() {
  const t = useTranslations("Checkout");
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast.info(t("cancelled"));
  }, [t]);

  return null;
}
