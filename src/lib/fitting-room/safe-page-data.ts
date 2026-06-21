import { FITTING_ROOM_STATIC_CATALOG } from "@/lib/catalog/fitting-room-catalog";
import type { FittingRoomProduct } from "@/lib/try-on/types";

export type FittingRoomPageData = {
  products: FittingRoomProduct[];
  apiConfigured: boolean;
};

/** Never throws — fitting room page always gets a usable payload. */
export async function loadFittingRoomPageData(): Promise<FittingRoomPageData> {
  let products: FittingRoomProduct[] = FITTING_ROOM_STATIC_CATALOG;
  let apiConfigured = false;

  try {
    const { getFittingRoomProducts } = await import("@/server/fitting-room");
    products = await getFittingRoomProducts();
  } catch (err) {
    console.error("[fitting-room] products load failed", err);
  }

  try {
    const { isTryOnConfiguredFromEnv } = await import("@/lib/try-on/try-on-config");
    apiConfigured = isTryOnConfiguredFromEnv();
  } catch (err) {
    console.error("[fitting-room] try-on config check failed", err);
  }

  return { products, apiConfigured };
}
