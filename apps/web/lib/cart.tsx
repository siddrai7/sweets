'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sweets.cart';

export interface CartLine {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPrice: string;
  /** List price, when the variant is on offer. Used to show savings. */
  mrp?: string;
  image?: string;
  quantity: number;
  /** Units available when added; caps the stepper. The API re-checks at checkout. */
  maxQuantity?: number;
}

interface CartContext {
  lines: CartLine[];
  /** True once the saved cart has been read from storage. */
  loaded: boolean;
  count: number;
  subtotal: number;
  /** Sum of (MRP − price) across lines on offer. */
  savings: number;
  isOpen: boolean;
  /** The most recent add, so the UI can confirm it. `at` changes on every add. */
  lastAdded: { line: CartLine; at: number } | null;
  openCart: () => void;
  closeCart: () => void;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number, options?: { open?: boolean }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  quantityOf: (variantId: string) => number;
  clear: () => void;
}

const Ctx = createContext<CartContext | null>(null);

function clamp(line: CartLine, quantity: number) {
  return Math.min(quantity, line.maxQuantity ?? 100);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContext['lastAdded']>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, loaded]);

  const add = useCallback<CartContext['add']>((line, quantity = 1, options = {}) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId
            ? { ...l, ...line, quantity: clamp({ ...l, ...line }, l.quantity + quantity) }
            : l,
        );
      }
      const next = { ...line, quantity: 0 };
      return [...prev, { ...next, quantity: clamp(next, quantity) }];
    });
    setLastAdded({ line: { ...line, quantity }, at: Date.now() });
    if (options.open) setIsOpen(true);
  }, []);

  const setQuantity = useCallback<CartContext['setQuantity']>(
    (variantId, quantity) =>
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.variantId !== variantId)
          : prev.map((l) =>
              l.variantId === variantId ? { ...l, quantity: clamp(l, quantity) } : l,
            ),
      ),
    [],
  );

  const value = useMemo<CartContext>(() => {
    const quantities = new Map(lines.map((l) => [l.variantId, l.quantity]));
    return {
      lines,
      loaded,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0),
      savings: lines.reduce(
        (sum, l) =>
          sum + (l.mrp ? Math.max(0, Number(l.mrp) - Number(l.unitPrice)) * l.quantity : 0),
        0,
      ),
      isOpen,
      lastAdded,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add,
      setQuantity,
      quantityOf: (variantId) => quantities.get(variantId) ?? 0,
      clear: () => setLines([]),
    };
  }, [lines, loaded, isOpen, lastAdded, add, setQuantity]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
