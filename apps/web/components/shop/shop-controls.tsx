'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PRODUCT_SORTS, type ProductSort } from '@sweets/types';
import { PRICE_BANDS } from '@/lib/price-bands';

const SORT_LABELS: Record<ProductSort, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'name-asc': 'Name: A to Z',
  'name-desc': 'Name: Z to A',
  newest: 'Newest',
};

function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
}

export function SortSelect() {
  const params = useSearchParams();
  const update = useUpdateParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-cocoa-soft sm:inline">Sort by</span>
      <select
        value={params.get('sort') ?? 'featured'}
        onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })}
        className="rounded-full border border-brand-200 bg-white px-4 py-2 font-medium focus:border-brand-600 focus:outline-none"
      >
        {PRODUCT_SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Filters() {
  const params = useSearchParams();
  const update = useUpdateParams();
  const activePrice = params.get('price');
  const inStock = params.get('inStock') === 'true';

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wider">Price</legend>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {PRICE_BANDS.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="price"
                checked={activePrice === b.id}
                onChange={() => update({ price: b.id })}
                className="h-4 w-4 accent-brand-600"
              />
              {b.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => update({ inStock: e.target.checked ? 'true' : null })}
          className="h-4 w-4 accent-brand-600"
        />
        Available today only
      </label>
      {(activePrice || inStock) && (
        <button
          onClick={() => update({ price: null, inStock: null })}
          className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
