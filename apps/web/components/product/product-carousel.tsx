'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@sweets/types';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/section-heading';
import { ProductCard } from './product-card';

interface Props {
  title: React.ReactNode;
  eyebrow?: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  /** Set false on a shelf whose title already says what the badge would. */
  badges?: boolean;
}

/** Horizontally scrolling shelf: swipe on mobile, arrow buttons on desktop. */
export function ProductCarousel({
  title,
  eyebrow,
  subtitle,
  products,
  viewAllHref,
  badges = true,
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, products.length]);

  if (!products.length) return null;

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <section className="container-page py-7 sm:py-10">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} href={viewAllHref} />
      <div className="relative">
        <div
          ref={track}
          onScroll={measure}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 sm:mx-0 sm:gap-4 sm:scroll-px-0 sm:px-0"
        >
          {products.map((p, i) => (
            <div
              key={p.id}
              className="w-[44%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[calc(20%-0.8rem)]"
            >
              <ProductCard product={p} priority={i < 2} badge={badges} />
            </div>
          ))}
        </div>
        {!edges.start && (
          <button
            onClick={() => scroll(-1)}
            className="absolute -left-5 top-[35%] hidden h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white shadow-card transition hover:scale-105 lg:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>
        )}
        {!edges.end && (
          <button
            onClick={() => scroll(1)}
            className="absolute -right-5 top-[35%] hidden h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white shadow-card transition hover:scale-105 lg:flex"
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        )}
      </div>
    </section>
  );
}
