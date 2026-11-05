'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@sweets/types';
import { browserApi } from '@/lib/browser-api';
import { recentlyViewed, recordView } from '@/lib/recently-viewed';
import { ProductCarousel } from './product-carousel';

/**
 * "Recently viewed" shelf from this device's history. On a product page pass `current` to
 * record the visit (and leave it out of the shelf).
 */
export function RecentlyViewed({ current }: { current?: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const ids = recentlyViewed().filter((id) => id !== current);
    if (current) recordView(current);
    if (!ids.length) return;
    browserApi.shopper
      .productsByIds(ids.slice(0, 10))
      .then(setProducts)
      .catch(() => {});
  }, [current]);

  if (products.length < 2) return null;
  return (
    <ProductCarousel
      eyebrow="Pick up where you left off"
      title="Recently viewed"
      products={products}
    />
  );
}
