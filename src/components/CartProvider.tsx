"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  /** quantity defaults to 1; adding a product already in the cart increments its existing line instead of duplicating it. */
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// Client-side only, scoped to this browser (localStorage) — there's no Cart
// model in the schema and no requirement to sync it across devices; only the
// Order it eventually becomes is persisted server-side. Starts empty on
// every render (server and first client paint agree, avoiding a hydration
// mismatch — see RouteThemeScope.tsx for the sharper version of this same
// problem) and hydrates from storage in an effect right after mount.
//
// `hasHydrated` is STATE, not a ref. That distinction is load-bearing: an
// earlier version used a ref flipped synchronously inside the hydrate
// effect, which a second effect (persist-on-change) read in the same
// commit — under React 18 Strict Mode (Next.js dev's default), effects
// double-fire on mount, and that second effect saw the flag already true
// while `items` was still the pre-hydration `[]` from this render's
// closure, and wrote that empty array over a real saved cart (confirmed via
// real browser testing: a saved cart was reliably gone after any hard
// reload). Because state updates don't mutate the current closure the way a
// ref does, every effect within one commit still sees the same pre-update
// values, so the persist effect can't act on a flag some earlier effect in
// the same pass already flipped — it only sees `hasHydrated: true` once an
// actual re-render has happened with the real data alongside it.
export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/blocked storage — start from an empty cart rather than crash.
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/blocked (private mode) — the cart still works for this
      // tab's session, it just won't survive a reload.
    }
  }, [items, hasHydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem: CartContextValue["removeItem"] = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const setQuantity: CartContextValue["setQuantity"] = (productId, quantity) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };

  const clear = () => setItems([]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}
