'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CartView } from '@sweets/types';
import { useSession } from './session';

const STORAGE_KEY = 'sweets.cart';
/** Set while a signed-in change hasn't reached the server yet, so a reload pushes it. */
const DIRTY_KEY = 'sweets.cart.dirty';
const SYNC_DELAY_MS = 400;

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

/** What the server stores: just variant + quantity, order-independent. */
const snapshot = (lines: CartLine[]) =>
  lines
    .map((l) => `${l.variantId}:${l.quantity}`)
    .sort()
    .join('|');

const toItems = (lines: CartLine[]) =>
  lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));

/** Server lines carry live prices and stock, so they replace whatever the device had. */
const fromServer = (view: CartView): CartLine[] =>
  view.items.map((i) => ({
    variantId: i.variantId,
    productSlug: i.productSlug,
    productName: i.productName,
    variantLabel: i.variantLabel,
    unitPrice: i.unitPrice,
    mrp: i.mrp ?? undefined,
    image: i.image ?? undefined,
    quantity: Math.min(i.quantity, Math.max(i.available, 1)),
    maxQuantity: i.available,
  }));

function setDirty(dirty: boolean) {
  try {
    if (dirty) localStorage.setItem(DIRTY_KEY, '1');
    else localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* storage unavailable */
  }
}
function isDirty() {
  try {
    return localStorage.getItem(DIRTY_KEY) === '1';
  } catch {
    return false;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContext['lastAdded']>(null);
  const { user, ready, api } = useSession();
  const userId = user?.id ?? null;
  const linesRef = useRef(lines);
  linesRef.current = lines;
  /** Snapshot the server is known to hold; null until this device has synced. */
  const synced = useRef<string | null>(null);
  /** Previous signed-in user id: undefined = page just loaded. */
  const prevUser = useRef<string | null | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyServer = useCallback((view: CartView) => {
    const next = fromServer(view);
    synced.current = snapshot(next);
    setLines(next);
  }, []);

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

  /*
   * Account sync. Signed out, the cart lives only in this browser. Signed in, the account
   * holds the cart so it follows the customer to every device:
   *  - signing in merges this browser's cart into the account (larger quantity wins);
   *  - opening the site already signed in loads the account cart (or pushes a local edit
   *    that never reached the server);
   *  - every change is saved to the account shortly after it's made;
   *  - coming back to the tab refreshes from the account, picking up other devices' edits;
   *  - signing out clears this device; the account keeps the cart.
   */
  useEffect(() => {
    if (!ready || !loaded) return;
    const prev = prevUser.current;
    prevUser.current = userId;
    if (prev === userId) return;

    if (!userId) {
      if (prev) {
        synced.current = null;
        setDirty(false);
        setLines([]);
      }
      return;
    }

    const local = toItems(linesRef.current);
    const load =
      prev === null
        ? api.account.mergeCart(local) // signed in on this page
        : prev === undefined && isDirty()
          ? api.account.replaceCart(local) // unsent edit from last visit
          : api.account.cart();
    load
      .then((view) => {
        setDirty(false);
        applyServer(view);
      })
      .catch(() => {
        /* offline or not a shopper account: keep the local cart */
      });
  }, [ready, loaded, userId, api, applyServer]);

  // Save changes to the account, debounced.
  useEffect(() => {
    if (!userId || synced.current === null) return;
    const current = snapshot(lines);
    if (current === synced.current) return;
    setDirty(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      api.account
        .replaceCart(toItems(linesRef.current))
        .then((view) => {
          setDirty(false);
          // Only adopt the server's copy if nothing changed while the request was in flight.
          if (snapshot(linesRef.current) === current) applyServer(view);
          else synced.current = snapshot(fromServer(view));
        })
        .catch(() => {
          /* stays dirty; retried on the next change or visit */
        });
    }, SYNC_DELAY_MS);
  }, [lines, userId, api, applyServer]);

  // Pick up changes made on other devices when the customer comes back to this tab.
  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible' || timer.current || isDirty()) return;
      if (synced.current === null) return;
      api.account
        .cart()
        .then(applyServer)
        .catch(() => undefined);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [userId, api, applyServer]);

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
