import { FITTING_ROOM_STATIC_CATALOG } from "@/lib/catalog/fitting-room-catalog";
import { isTryOnConfigured } from "@/lib/try-on/providers/registry";
import { getFittingRoomProducts } from "@/server/fitting-room";
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
    products = await getFittingRoomProducts();
  } catch (err) {
    console.error("[fitting-room] products load failed", err);
  }

  try {
    apiConfigured = isTryOnConfigured();
  } catch (err) {
    console.error("[fitting-room] try-on config check failed", err);
  }

  return { products, apiConfigured };
}
