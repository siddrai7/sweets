'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginated, Product, ProductQuery } from '@sweets/types';
import { ProductCard } from '@/components/product/product-card';
import { SearchIcon } from '@/components/ui/icons';
import { browserApi } from '@/lib/browser-api';

interface Props {
  initial: Paginated<Product>;
  query: Partial<ProductQuery>;
}

/** First page is server-rendered (good for SEO); further pages stream in as you scroll. */
export function ProductGrid({ initial, query }: Props) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = items.length < initial.total;

  // Reset when filters change and the server sends a new first page.
  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
    setError(false);
  }, [initial]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const next = await browserApi.catalog.products({
        ...query,
        page: page + 1,
        pageSize: initial.pageSize,
      });
      setItems((prev) => [...prev, ...next.items]);
      setPage(next.page);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [query, page, initial.pageSize]);

  // Infinite scroll: load the next page as the end of the grid approaches.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading || error) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: '600px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, error, loadMore]);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-brand-300 bg-white/50 px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <SearchIcon size={28} />
        </span>
        <p className="mt-5 font-display text-2xl">No sweets match these filters</p>
        <p className="mt-2 max-w-sm text-sm text-cocoa-soft">
          Try removing a filter, or browse everything we made this morning.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
        {loading &&
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[1.25rem] border border-brand-200 bg-white p-2.5"
            >
              <div className="aspect-square rounded-[0.9rem] bg-brand-100" />
              <div className="mt-3 h-3 w-2/3 rounded bg-brand-100" />
              <div className="mt-2 h-3 w-1/3 rounded bg-brand-100" />
            </div>
          ))}
      </div>
      <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-cocoa-soft">
          Showing {items.length} of {initial.total}
        </p>
        {error && (
          <>
            <p className="text-sm text-brand-600">Couldn&apos;t load more products.</p>
            <button onClick={loadMore} className="btn-ghost">
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
