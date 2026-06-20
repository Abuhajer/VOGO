"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && window.gtag) {
    window.gtag("config", gaId, { page_path: path });
  }

  if (window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", name, params);
  }

  if (window.fbq) {
    window.fbq("trackCustom", name, params);
  }
}

export function trackPurchase(value: number, currency = "JOD") {
  trackEvent("purchase", { value, currency });
  if (window.fbq) {
    window.fbq("track", "Purchase", { value, currency });
  }
}
