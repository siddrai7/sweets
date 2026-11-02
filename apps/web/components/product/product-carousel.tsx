'use client';

import Link from 'next/link';
import { useRef } from 'react';
import type { Product } from '@sweets/types';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { ProductCard } from './product-card';

interface Props {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
}

/** Horizontally scrolling row: swipe on mobile, arrow buttons on desktop. */
export function ProductCarousel({ title, subtitle, products, viewAllHref }: Props) {
  const track = useRef<HTMLDivElement>(null);
  if (!products.length) return null;

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section className="container-page py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-2 text-cocoa-soft">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="mr-2 text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            className="hidden rounded-full border border-brand-200 bg-white p-2 hover:border-brand-600 sm:block"
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => scroll(1)}
            className="hidden rounded-full border border-brand-200 bg-white p-2 hover:border-brand-600 sm:block"
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-[31%] lg:w-[23.5%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
