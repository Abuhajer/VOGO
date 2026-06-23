"use client";

import { useEffect } from "react";
import FittingRoomErrorFallback from "@/components/fitting-room/FittingRoomErrorFallback";

export default function FittingRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[fitting-room] route error", error);
  }, [error]);

  return (
    <main className="mt-[calc(var(--site-nav-height)+env(safe-area-inset-top))] flex min-h-[calc(100dvh-var(--site-nav-height)-env(safe-area-inset-top))] flex-col overflow-hidden bg-void">
      <FittingRoomErrorFallback onRetry={reset} />
    </main>
  );
}
