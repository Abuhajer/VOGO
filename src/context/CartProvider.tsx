"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  calcCartSubtotal,
  resolveCartLineId,
  type CartItem,
} from "@/lib/cart";
import { refreshCartItemPrices } from "@/server/cart-pricing";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  removeItem: (cartLineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      setItems([]);
    }
    setHydrated(true);
  }, []);

  const slugKey = useMemo(
    () =>
      items
        .map((item) => item.slug)
        .sort()
        .join(","),
    [items]
  );

  useEffect(() => {
    if (!hydrated || !slugKey) return;

    const slugs = slugKey.split(",");
    void refreshCartItemPrices(slugs).then((priceMap) => {
      setItems((current) =>
        current.map((item) =>
          priceMap[item.slug] != null ? { ...item, price: priceMap[item.slug]! } : item
        )
      );
    });
  }, [hydrated, slugKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const lineId = resolveCartLineId(item);
      const withLineId = { ...item, cartLineId: lineId };

      setItems((current) => {
        const existing = current.find((entry) => resolveCartLineId(entry) === lineId);
        if (existing) {
          return current.map((entry) =>
            resolveCartLineId(entry) === lineId
              ? { ...entry, quantity: entry.quantity + quantity }
              : entry
          );
        }
        return [...current, { ...withLineId, quantity }];
      });
    },
    []
  );

  const updateQuantity = useCallback((cartLineId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          resolveCartLineId(entry) === cartLineId ? { ...entry, quantity } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((cartLineId: string) => {
    setItems((current) =>
      current.filter((entry) => resolveCartLineId(entry) !== cartLineId)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: calcCartSubtotal(items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
