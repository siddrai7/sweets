'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from './session';

const KEY = 'sweets.wishlist';

interface WishlistContext {
  ids: Set<string>;
  /** False until the saved list has been read (server or device). */
  loaded: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
}

const Ctx = createContext<WishlistContext | null>(null);

const readLocal = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
};
const writeLocal = (ids: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
};

/**
 * Saved sweets. Signed-in customers' wishlists live on the server (every device); guests keep
 * one on this device, which is merged into their account when they sign in.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, api } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const merged = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      merged.current = null;
      setIds(new Set(readLocal()));
      setLoaded(true);
      return;
    }
    if (merged.current === user.id) return;
    merged.current = user.id;
    (async () => {
      const local = readLocal();
      let server = await api.account.wishlistIds().catch(() => [] as string[]);
      for (const id of local.filter((id) => !server.includes(id))) {
        server = await api.account.addToWishlist(id).catch(() => server);
      }
      if (local.length) writeLocal([]);
      setIds(new Set(server));
      setLoaded(true);
    })();
  }, [ready, user, api]);

  const toggle = useCallback(
    async (productId: string) => {
      const on = ids.has(productId);
      const next = new Set(ids);
      if (on) next.delete(productId);
      else next.add(productId);
      setIds(next);
      if (!user) return writeLocal([...next]);
      try {
        const saved = on
          ? await api.account.removeFromWishlist(productId)
          : await api.account.addToWishlist(productId);
        setIds(new Set(saved));
      } catch {
        setIds(ids);
      }
    },
    [ids, user, api],
  );

  const has = useCallback((id: string) => ids.has(id), [ids]);
  return <Ctx.Provider value={{ ids, loaded, has, toggle }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
