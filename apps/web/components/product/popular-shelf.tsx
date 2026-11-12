'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@sweets/types';
import { browserApi } from '@/lib/browser-api';
import { ProductCarousel } from './product-carousel';

/** Bestsellers, fetched in the browser, for pages that would otherwise be a dead end. */
export function PopularShelf({ title = 'Popular right now' }: { title?: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    browserApi.catalog
      .products({ tag: 'bestseller', pageSize: 10 })
      .then((r) => setProducts(r.items))
      .catch(() => {});
  }, []);

  if (products.length < 2) return null;
  return (
    <ProductCarousel
      eyebrow="A good place to start"
      title={title}
      products={products}
      viewAllHref="/shop?tag=bestseller"
      badges={false}
    />
  );
}
