'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Product } from '@sweets/types';
import { AccountHeader } from '@/components/account/account-nav';
import { ProductCard } from '@/components/product/product-card';
import { HeartIcon } from '@/components/ui/icons';
import { browserApi } from '@/lib/browser-api';
import { useSession } from '@/lib/session';
import { useWishlist } from '@/lib/wishlist';

/** Saved sweets. Works for guests too (kept on this device until they sign in). */
export default function WishlistPage() {
  const { user, ready } = useSession();
  const { ids, loaded } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);
  const key = [...ids].join(',');

  const cache = useRef<Product[]>([]);

  useEffect(() => {
    if (!loaded) return;
    const list = key ? key.split(',') : [];
    if (!list.length) return setProducts([]);
    // Removing an item needs no refetch; only fetch when something new was saved.
    const have = cache.current;
    if (list.every((id) => have.some((p) => p.id === id))) {
      return setProducts(have.filter((p) => list.includes(p.id)));
    }
    let live = true;
    browserApi.shopper
      .productsByIds(list.slice(0, 30))
      .then((ps) => {
        if (!live) return;
        cache.current = ps;
        setProducts(ps);
      })
      .catch(() => live && setProducts([]));
    return () => {
      live = false;
    };
  }, [loaded, key]);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-3xl">
        <AccountHeader title="Wishlist" />
      </div>
      {!user && ready && (
        <p className="mt-6 text-sm text-cocoa-soft">
          Saved on this device.{' '}
          <Link href="/login?next=/account/wishlist" className="font-bold text-brand-600">
            Sign in
          </Link>{' '}
          to keep your wishlist on every device.
        </p>
      )}
      {products === null ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-[1.25rem] bg-white ring-1 ring-brand-200"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-brand-300 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <HeartIcon size={26} />
          </span>
          <p className="mt-4 font-display text-2xl">Nothing saved yet</p>
          <p className="mt-1 max-w-xs text-sm text-cocoa-soft">
            Tap the heart on any sweet to save it for later.
          </p>
          <Link href="/shop" className="btn-primary mt-6">
            Browse sweets
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
