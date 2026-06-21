import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { loadFittingRoomPageData } from "@/lib/fitting-room/safe-page-data";
import FittingRoomClient from "@/components/fitting-room/FittingRoomClient";
import FittingRoomErrorBoundary from "@/components/fitting-room/FittingRoomErrorBoundary";

export default async function FittingRoomPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { product?: string };
}) {
  setRequestLocale(locale);
  const { products, apiConfigured } = await loadFittingRoomPageData();

  return (
    <main className="surface-dark mt-[calc(5.75rem+env(safe-area-inset-top))] flex h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] max-h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] flex-col overflow-hidden bg-[#050508]">
      <Suspense fallback={null}>
        <FittingRoomErrorBoundary>
          <FittingRoomClient
            products={products}
            initialProductSlug={searchParams.product ?? null}
            apiConfigured={apiConfigured}
          />
        </FittingRoomErrorBoundary>
      </Suspense>
    </main>
  );
}
