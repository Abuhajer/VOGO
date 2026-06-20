import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getFittingRoomProducts } from "@/server/fitting-room";
import { isTryOnConfigured } from "@/lib/try-on/generate";
import FittingRoomClient from "@/components/fitting-room/FittingRoomClient";

export default async function FittingRoomPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { product?: string };
}) {
  setRequestLocale(locale);
  const products = await getFittingRoomProducts();
  const apiConfigured = isTryOnConfigured();

  return (
    <main className="surface-dark mt-[calc(5.75rem+env(safe-area-inset-top))] flex h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] max-h-[calc(100dvh-5.75rem-env(safe-area-inset-top))] flex-col overflow-hidden bg-[#050508]">
      <Suspense fallback={null}>
        <FittingRoomClient
          products={products}
          initialProductSlug={searchParams.product ?? null}
          apiConfigured={apiConfigured}
        />
      </Suspense>
    </main>
  );
}
