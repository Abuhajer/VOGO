"use client";

import type { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollProgress from "@/components/ui/ScrollProgress";
import ScrollToTop from "@/components/ui/ScrollToTop";

export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ScrollProgress />
      {children}
      <ScrollToTop />
    </ErrorBoundary>
  );
}
