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
    <main className="surface-dark mt-[calc(5.75rem+env(safe-area-inset-top))] flex min-h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] flex-col overflow-hidden bg-[#050508]">
      <FittingRoomErrorFallback onRetry={reset} />
    </main>
  );
}
