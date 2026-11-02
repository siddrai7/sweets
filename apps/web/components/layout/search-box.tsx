'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/money';
import type { Product } from '@sweets/types';
import { AddButton } from '@/components/product/add-button';
import { ProductImage } from '@/components/product/product-image';
import {
  ArrowLeft,
  ArrowRight,
  CloseIcon,
  HistoryIcon,
  SearchIcon,
  TrendIcon,
} from '@/components/ui/icons';
import { browserApi } from '@/lib/browser-api';
import { OPEN_SEARCH_EVENT } from '@/lib/events';
import { isAvailable } from '@/lib/pricing';
import { site } from '@/lib/site';

const RECENT_KEY = 'sweets.recentSearches';

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/**
 * Always-visible search with instant suggestions, recent and popular searches. Becomes a
 * full-screen panel on phones, a dropdown on desktop.
 */
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(pathname === '/search' ? (params.get('q') ?? '') : '');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [hint, setHint] = useState(0);
  const term = q.trim();

  useEffect(() => setRecent(readRecent()), []);

  // Keep the box in sync with the URL on the search page; close on any navigation.
  useEffect(() => {
    setOpen(false);
    if (pathname === '/search') setQ(params.get('q') ?? '');
  }, [pathname, params]);

  // Rotate the placeholder through popular searches.
  useEffect(() => {
    if (open || q) return;
    const t = setInterval(() => setHint((h) => (h + 1) % site.popularSearches.length), 2800);
    return () => clearInterval(t);
  }, [open, q]);

  // Debounced suggestions; ignore responses that arrive out of order.
  useEffect(() => {
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let stale = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await browserApi.catalog.products({ search: term, pageSize: 6 });
        if (!stale) setResults(res.items);
      } catch {
        if (!stale) setResults([]);
      } finally {
        if (!stale) setLoading(false);
      }
    }, 180);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [term]);

  useEffect(() => setActive(-1), [results]);

  // Close when clicking outside (desktop dropdown).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Lock page scroll behind the full-screen panel on phones.
  useEffect(() => {
    if (!open || window.matchMedia('(min-width: 1024px)').matches) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const focus = () => {
      setOpen(true);
      inputRef.current?.focus();
    };
    window.addEventListener(OPEN_SEARCH_EVENT, focus);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, focus);
  }, []);

  const go = useCallback(
    (query: string) => {
      const value = query.trim();
      if (!value) return;
      const next = [
        value,
        ...readRecent().filter((r) => r.toLowerCase() !== value.toLowerCase()),
      ].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      setRecent(next);
      setQ(value);
      setOpen(false);
      inputRef.current?.blur();
      router.push(`/search?q=${encodeURIComponent(value)}`);
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0 && results[active]) {
      e.preventDefault();
      setOpen(false);
      router.push(`/products/${results[active]!.slug}`);
    }
  }

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* storage unavailable */
    }
    setRecent([]);
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${open ? 'max-lg:fixed max-lg:inset-0 max-lg:z-[60] max-lg:flex max-lg:flex-col max-lg:bg-brand-50' : ''}`}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={`flex items-center gap-2 ${open ? 'max-lg:border-b max-lg:border-brand-200 max-lg:bg-white max-lg:p-3' : ''}`}
      >
        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 lg:hidden"
            aria-label="Close search"
          >
            <ArrowLeft />
          </button>
        )}
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <SearchIcon
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-soft"
          />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={q}
            autoComplete="off"
            enterKeyHint="search"
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={`Search for “${site.popularSearches[hint]}”`}
            role="combobox"
            aria-expanded={open}
            aria-controls="search-panel"
            aria-activedescendant={active >= 0 ? `search-opt-${active}` : undefined}
            className="h-12 w-full rounded-2xl border border-brand-200 bg-white pl-11 pr-10 text-[0.95rem] shadow-[0_1px_2px_rgb(45_10_16/0.04)] transition placeholder:text-cocoa-soft/70 focus:border-cocoa focus:outline-none focus:ring-4 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-cocoa-soft hover:bg-brand-100"
              aria-label="Clear search"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </label>
      </form>

      {open && (
        <div
          id="search-panel"
          className="z-50 overflow-y-auto bg-brand-50 max-lg:flex-1 lg:absolute lg:inset-x-0 lg:top-[calc(100%+0.5rem)] lg:max-h-[70vh] lg:animate-rise lg:rounded-3xl lg:border lg:border-brand-200 lg:bg-white lg:shadow-float"
        >
          {term.length < 2 ? (
            <div className="space-y-6 p-5">
              {recent.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-cocoa-soft">
                      Recent searches
                    </h3>
                    <button onClick={clearRecent} className="text-xs font-semibold text-brand-600">
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => go(r)} className="chip">
                        <HistoryIcon size={14} className="text-cocoa-soft" /> {r}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <section>
                <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-cocoa-soft">
                  Popular right now
                </h3>
                <div className="flex flex-wrap gap-2">
                  {site.popularSearches.map((r) => (
                    <button key={r} onClick={() => go(r)} className="chip">
                      <TrendIcon size={14} className="text-saffron-600" /> {r}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="p-2">
              {loading && results.length === 0 && (
                <ul className="space-y-1 p-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex animate-pulse items-center gap-3 p-2">
                      <span className="h-12 w-12 rounded-xl bg-brand-100" />
                      <span className="h-3 w-1/2 rounded bg-brand-100" />
                    </li>
                  ))}
                </ul>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="font-display text-xl">No matches for “{term}”</p>
                  <p className="mt-1 text-sm text-cocoa-soft">Try “ladoo”, “katli” or “namkeen”.</p>
                </div>
              )}
              {results.length > 0 && (
                <ul role="listbox" aria-label="Suggestions">
                  {results.map((p, i) => {
                    const v = p.variants.find(isAvailable) ?? p.variants[0];
                    return (
                      <li
                        key={p.id}
                        id={`search-opt-${i}`}
                        role="option"
                        aria-selected={i === active}
                        className={`flex items-center gap-3 rounded-2xl p-2 transition ${i === active ? 'bg-brand-100' : 'hover:bg-brand-50'}`}
                      >
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <ProductImage
                            name={p.name}
                            slug={p.slug}
                            src={p.images[0]}
                            sizes="56px"
                            className="h-14 w-14 shrink-0 rounded-xl"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">
                              <Highlight text={p.name} term={term} />
                            </span>
                            <span className="block text-xs text-cocoa-soft">
                              {v?.label} · {v && formatMoney(v.price)}
                            </span>
                          </span>
                        </Link>
                        <AddButton product={p} variant={v} />
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                onClick={() => go(q)}
                className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                See all results for “{term}”
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, term }: { text: string; term: string }) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-saffron-100 text-inherit">{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}
