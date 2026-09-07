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

/**
 * The cart.
 *
 * It holds slugs and quantities and nothing else. Prices, titles, images
 * and every purchase rule stay in Odoo and are resolved server-side each
 * time the cart is rendered or submitted — so a cart cannot carry a stale
 * price, and a product added to Odoo tomorrow needs no change here.
 *
 * It lives in localStorage rather than in an Odoo session. These are free
 * digital goods with no stock to reserve, so there is nothing a server-side
 * cart would protect; keeping it local means no session cookie, no orphaned
 * draft orders in Odoo from people who browsed and left, and a cart that
 * survives a refresh. The order is created once, at checkout.
 *
 * Quantities are clamped where the cart is rendered, against the product's
 * own maxQuantity from Odoo — the provider deliberately doesn't know the
 * rules, so there is one place they are enforced on the client and one
 * authoritative place on the server (the checkout action).
 */

const STORAGE_KEY = "ks-cart-v1";

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  /** Total items, for the header badge. */
  count: number;
  /** Cleared on mount-read so the first paint doesn't flash a wrong count. */
  ready: boolean;
  add: (slug: string, max: number) => void;
  setQuantity: (slug: string, quantity: number, max: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l === "object" &&
          l !== null &&
          typeof (l as CartLine).slug === "string" &&
          Number.isFinite((l as CartLine).quantity)
      )
      .map((l) => ({ slug: l.slug, quantity: Math.max(1, Math.floor(l.quantity)) }));
  } catch {
    // Private mode, blocked storage, corrupted JSON — an empty cart is the
    // right answer to all of them.
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
  }, []);

  // Persist, and keep two tabs of the same site in step.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* nothing to do — the cart still works for this page view */
    }
  }, [lines, ready]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((slug: string, max: number) => {
    setLines((current) => {
      const existing = current.find((l) => l.slug === slug);
      if (!existing) return [...current, { slug, quantity: 1 }];
      return current.map((l) =>
        l.slug === slug ? { ...l, quantity: Math.min(l.quantity + 1, Math.max(1, max)) } : l
      );
    });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number, max: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.slug !== slug)
        : current.map((l) =>
            l.slug === slug
              ? { ...l, quantity: Math.min(Math.floor(quantity), Math.max(1, max)) }
              : l
          )
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((current) => current.filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
      has: (slug: string) => lines.some((l) => l.slug === slug),
    }),
    [lines, ready, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
