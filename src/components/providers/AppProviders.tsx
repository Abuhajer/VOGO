"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartProvider";
import AnalyticsProvider from "@/components/marketing/AnalyticsProvider";
import CookieConsent from "@/components/marketing/CookieConsent";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <AnalyticsProvider />
        {children}
        <CookieConsent />
      </CartProvider>
    </SessionProvider>
  );
}
