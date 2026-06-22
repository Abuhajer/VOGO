import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { FITTING_ROOM_STATIC_CATALOG } from "@/lib/catalog/fitting-room-catalog";
import { staticAvatarsToItems } from "@/lib/fitting-room/avatars";
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

  let products = FITTING_ROOM_STATIC_CATALOG;
  let avatars = staticAvatarsToItems();
  let apiConfigured = false;

  try {
    const data = await loadFittingRoomPageData();
    products = data.products;
    avatars = data.avatars;
    apiConfigured = data.apiConfigured;
  } catch (err) {
    console.error("[fitting-room] page render failed", err);
  }

  return (
    <main className="mt-[calc(5.75rem+env(safe-area-inset-top))] flex h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] max-h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] flex-col overflow-hidden bg-void">
      <Suspense fallback={null}>
        <FittingRoomErrorBoundary>
          <FittingRoomClient
            products={products}
            avatars={avatars}
            initialProductSlug={searchParams.product ?? null}
            apiConfigured={apiConfigured}
          />
        </FittingRoomErrorBoundary>
      </Suspense>
    </main>
  );
}
