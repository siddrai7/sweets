'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { HeroSlide } from '@/content/home';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback(
    (i: number) => setIndex((i + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <section
      className="container-page pt-6"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div
              key={s.title}
              className={`relative flex min-h-[420px] w-full shrink-0 items-center bg-gradient-to-br ${s.theme} sm:min-h-[480px]`}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              aria-hidden={i !== index}
            >
              <Motif />
              <div className="relative max-w-2xl px-8 py-16 text-white sm:px-14">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  {s.eyebrow}
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-[1.1] sm:text-6xl">{s.title}</h2>
                <p className="mt-5 max-w-lg text-base text-white/90 sm:text-lg">{s.body}</p>
                <Link
                  href={s.cta.href}
                  tabIndex={i === index ? 0 : -1}
                  className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-cocoa transition hover:bg-brand-50"
                >
                  {s.cta.label}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white backdrop-blur hover:bg-white/30 md:block"
              aria-label="Previous slide"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => go(index + 1)}
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white backdrop-blur hover:bg-white/30 md:block"
              aria-label="Next slide"
            >
              <ChevronRight />
            </button>
            <div className="absolute bottom-6 left-8 flex gap-2 sm:left-14">
              {slides.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Decorative rangoli-style rings, standing in for banner photography. */
function Motif() {
  return (
    <svg
      className="pointer-events-none absolute -right-24 top-1/2 hidden h-[140%] -translate-y-1/2 text-white/15 md:block"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden
    >
      {[190, 150, 110, 70, 30].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={r % 80 === 30 ? '4 8' : undefined}
        />
      ))}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={200 + Math.cos(a) * 130}
            cy={200 + Math.sin(a) * 130}
            r="12"
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
