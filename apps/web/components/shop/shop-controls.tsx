'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { PRODUCT_SORTS } from '@sweets/types/constants';
import type { ProductSort } from '@sweets/types';
import { CheckIcon, ChevronDown, CloseIcon, SlidersIcon, SortIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { PRICE_BANDS } from '@/lib/price-bands';

const SORT_LABELS: Record<ProductSort, string> = {
  featured: 'Recommended',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'name-asc': 'Name: A to Z',
  'name-desc': 'Name: Z to A',
  newest: 'Newest first',
};

const COLLECTION_LABELS: Record<string, string> = {
  bestseller: 'Bestsellers',
  favourite: 'Favourites',
  classic: 'Classics',
};

function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  // Shown by CSS (globals.css): a progress bar, and the grid dims until new results arrive.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-pending', pending);
    return () => document.documentElement.removeAttribute('data-pending');
  }, [pending]);
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

/** Desktop sort dropdown. */
export function SortSelect() {
  const { params, update } = useUpdateParams();
  return (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="text-cocoa-soft">Sort by</span>
      <select
        value={params.get('sort') ?? 'featured'}
        onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })}
        className="appearance-none rounded-full border border-brand-200 bg-white py-2 pl-4 pr-9 font-semibold transition hover:border-cocoa/30 focus:border-cocoa focus:outline-none"
      >
        {PRODUCT_SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 text-cocoa-soft" />
    </label>
  );
}

function PriceOptions({
  active,
  onPick,
}: {
  active: string | null;
  onPick: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRICE_BANDS.map((b) => {
        const on = active === b.id;
        return (
          <button
            key={b.id}
            onClick={() => onPick(on ? null : b.id)}
            aria-pressed={on}
            className={`chip ${on ? 'chip-active' : ''}`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

function StockToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 text-sm font-semibold"
    >
      Available today only
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-pista-500' : 'bg-brand-200'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[1.375rem]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

/** Desktop sidebar filters. */
export function Filters() {
  const { params, update } = useUpdateParams();
  const price = params.get('price');
  const inStock = params.get('inStock') === 'true';
  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cocoa-soft">
          Price
        </legend>
        <PriceOptions active={price} onPick={(id) => update({ price: id })} />
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cocoa-soft">
          Availability
        </legend>
        <StockToggle on={inStock} onChange={(on) => update({ inStock: on ? 'true' : null })} />
      </fieldset>
    </div>
  );
}

/** Phone toolbar: sort and filter sheets plus one-tap quick filters. */
export function MobileControls() {
  const { params, update } = useUpdateParams();
  const [sheet, setSheet] = useState<'sort' | 'filter' | null>(null);
  const sort = (params.get('sort') ?? 'featured') as ProductSort;
  const price = params.get('price');
  const inStock = params.get('inStock') === 'true';
  const filterCount = (price ? 1 : 0) + (inStock ? 1 : 0);
  // Draft filter state inside the sheet, applied on "Show results".
  const [draft, setDraft] = useState({ price, inStock });

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
        <button
          onClick={() => setSheet('sort')}
          className={`chip ${sort !== 'featured' ? 'chip-active' : ''}`}
        >
          <SortIcon size={14} /> {sort === 'featured' ? 'Sort' : SORT_LABELS[sort]}
          <ChevronDown size={14} />
        </button>
        <button
          onClick={() => {
            setDraft({ price, inStock });
            setSheet('filter');
          }}
          className={`chip ${filterCount ? 'chip-active' : ''}`}
        >
          <SlidersIcon size={14} /> Filters
          {filterCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-xs text-cocoa">
              {filterCount}
            </span>
          )}
        </button>
        <button
          onClick={() => update({ inStock: inStock ? null : 'true' })}
          className={`chip ${inStock ? 'chip-active' : ''}`}
          aria-pressed={inStock}
        >
          {inStock && <CheckIcon size={14} />} In stock
        </button>
        {PRICE_BANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => update({ price: price === b.id ? null : b.id })}
            className={`chip ${price === b.id ? 'chip-active' : ''}`}
            aria-pressed={price === b.id}
          >
            {b.label}
          </button>
        ))}
      </div>

      <Sheet open={sheet === 'sort'} onClose={() => setSheet(null)} title="Sort by">
        <ul className="divide-y divide-brand-100 rounded-2xl bg-white ring-1 ring-brand-200">
          {PRODUCT_SORTS.map((s) => (
            <li key={s}>
              <button
                onClick={() => {
                  update({ sort: s === 'featured' ? null : s });
                  setSheet(null);
                }}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold"
              >
                {SORT_LABELS[s]}
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${s === sort ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-300'}`}
                >
                  {s === sort && <CheckIcon size={12} strokeWidth={3} />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet
        open={sheet === 'filter'}
        onClose={() => setSheet(null)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setDraft({ price: null, inStock: false })}
              className="btn-ghost flex-1"
            >
              Clear all
            </button>
            <button
              onClick={() => {
                update({ price: draft.price, inStock: draft.inStock ? 'true' : null });
                setSheet(null);
              }}
              className="btn-primary flex-[2]"
            >
              Show results
            </button>
          </div>
        }
      >
        <div className="space-y-7 pt-1">
          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cocoa-soft">
              Price
            </legend>
            <PriceOptions
              active={draft.price}
              onPick={(id) => setDraft((d) => ({ ...d, price: id }))}
            />
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cocoa-soft">
              Availability
            </legend>
            <StockToggle
              on={draft.inStock}
              onChange={(on) => setDraft((d) => ({ ...d, inStock: on }))}
            />
          </fieldset>
        </div>
      </Sheet>
    </>
  );
}

/** Removable chips for every active filter. */
export function ActiveFilters() {
  const { params, update } = useUpdateParams();
  const chips: { key: string; label: string; clear: Record<string, null> }[] = [];
  const band = PRICE_BANDS.find((b) => b.id === params.get('price'));
  if (band) chips.push({ key: 'price', label: band.label, clear: { price: null } });
  if (params.get('inStock') === 'true')
    chips.push({ key: 'stock', label: 'Available today', clear: { inStock: null } });
  const tag = params.get('tag');
  if (tag) chips.push({ key: 'tag', label: COLLECTION_LABELS[tag] ?? tag, clear: { tag: null } });
  if (!chips.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => update(c.clear)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 py-1 pl-3 pr-2 text-xs font-semibold transition hover:bg-brand-200"
        >
          {c.label}
          <CloseIcon size={12} strokeWidth={2.5} />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={() => update({ price: null, inStock: null, tag: null })}
          className="text-xs font-bold text-brand-600 underline-offset-4 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
