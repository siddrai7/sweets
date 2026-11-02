'use client';

import { useEffect, useState } from 'react';
import type { Paginated, Product, ProductQuery } from '@sweets/types';
import { ProductCard } from '@/components/product/product-card';
import { browserApi } from '@/lib/browser-api';

interface Props {
  initial: Paginated<Product>;
  query: Partial<ProductQuery>;
}

/** First page is server-rendered (good for SEO); further pages load in the browser. */
export function ProductGrid({ initial, query }: Props) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Reset when filters change and the server sends a new first page.
  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
  }, [initial]);

  async function loadMore() {
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
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-300 py-20 text-center">
        <p className="font-display text-2xl">No sweets match these filters</p>
        <p className="mt-2 text-cocoa-soft">Try removing a filter or browsing another category.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-cocoa-soft">
          Showing {items.length} of {initial.total}
        </p>
        {items.length < initial.total && (
          <button onClick={loadMore} disabled={loading} className="btn-outline">
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
        {error && (
          <p className="text-sm text-red-700">
            Couldn&apos;t load more products. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
