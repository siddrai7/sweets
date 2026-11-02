'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'sweets.cart';

export interface CartLine {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPrice: string;
  image?: string;
  quantity: number;
  /** Units available when added; caps the stepper. The API re-checks at checkout. */
  maxQuantity?: number;
}

interface CartContext {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number, options?: { open?: boolean }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
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

  const add = useCallback<CartContext['add']>((line, quantity = 1, options = { open: true }) => {
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

  return (
    <Ctx.Provider
      value={{
        lines,
        count: lines.reduce((n, l) => n + l.quantity, 0),
        subtotal: lines.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0),
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        add,
        setQuantity,
        clear: () => setLines([]),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
