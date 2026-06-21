"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollProgress from "@/components/ui/ScrollProgress";
import ScrollToTop from "@/components/ui/ScrollToTop";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ErrorBoundary key={pathname}>
      <ScrollProgress />
      {children}
      <ScrollToTop />
    </ErrorBoundary>
  );
}
