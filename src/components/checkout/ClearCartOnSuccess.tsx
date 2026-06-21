"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartProvider";
import { trackPurchase } from "@/lib/analytics";

export default function ClearCartOnSuccess({ subtotal }: { subtotal?: number }) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    if (subtotal !== undefined) {
      trackPurchase(subtotal);
    }
  }, [clearCart, subtotal]);

  return null;
}
