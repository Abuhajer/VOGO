import { FITTING_ROOM_STATIC_CATALOG } from "@/lib/catalog/fitting-room-catalog";
import { staticAvatarsToItems } from "@/lib/fitting-room/avatars";
import type { FittingRoomProduct } from "@/lib/try-on/types";
import type { FittingRoomAvatarItem } from "@/lib/fitting-room/avatars";

export type FittingRoomPageData = {
  products: FittingRoomProduct[];
  avatars: FittingRoomAvatarItem[];
  apiConfigured: boolean;
};

/** Never throws — fitting room page always gets a usable payload. */
export async function loadFittingRoomPageData(): Promise<FittingRoomPageData> {
  let products: FittingRoomProduct[] = FITTING_ROOM_STATIC_CATALOG;
  let avatars = staticAvatarsToItems();
  let apiConfigured = false;

  try {
    const { getFittingRoomProducts } = await import("@/server/fitting-room");
    products = await getFittingRoomProducts();
  } catch (err) {
    console.error("[fitting-room] products load failed", err);
  }

  try {
    const { listActiveAvatars } = await import("@/server/fitting-room-avatars");
    avatars = await listActiveAvatars();
  } catch (err) {
    console.error("[fitting-room] avatars load failed", err);
  }

  try {
    const { isTryOnConfiguredFromEnv } = await import("@/lib/try-on/try-on-config");
    apiConfigured = isTryOnConfiguredFromEnv();
  } catch (err) {
    console.error("[fitting-room] try-on config check failed", err);
  }

  return { products, avatars, apiConfigured };
}
