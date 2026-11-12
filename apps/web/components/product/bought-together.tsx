'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@sweets/types';
import { CheckIcon, PlusIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { formatMoney } from '@/lib/money';
import { isAvailable, toCartLine } from '@/lib/pricing';
import { ProductImage } from './product-image';

/** "Frequently bought together": this product plus two companions, added in one tap. */
export function BoughtTogether({ product, others }: { product: Product; others: Product[] }) {
  const { add, openCart } = useCart();
  const picks = [product, ...others.slice(0, 2)]
    .map((p) => ({ p, v: p.variants.find(isAvailable) }))
    .filter((x): x is { p: Product; v: NonNullable<typeof x.v> } => !!x.v);
  const [chosen, setChosen] = useState(() => new Set(picks.map((x) => x.p.id)));
  if (picks.length < 2) return null;

  const selected = picks.filter((x) => chosen.has(x.p.id));
  const total = selected.reduce((s, x) => s + Number(x.v.price), 0);

  return (
    <section className="container-page py-8">
      <div className="rounded-[2rem] bg-white p-5 ring-1 ring-brand-200 sm:p-8">
        <p className="eyebrow">Complete the box</p>
        <h2 className="mt-2 text-3xl font-light">Frequently bought together</h2>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
          <ul className="grid flex-1 grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            {picks.map(({ p, v }, i) => {
              const on = chosen.has(p.id);
              return (
                <li key={p.id} className="sm:flex sm:items-center sm:gap-3">
                  {i > 0 && <PlusIcon size={18} className="hidden text-cocoa-soft sm:block" />}
                  <label
                    className={`flex cursor-pointer flex-col gap-2 rounded-2xl p-1 text-[0.8rem] transition sm:w-40 sm:p-2 sm:text-sm ${on ? '' : 'opacity-50'}`}
                  >
                    <span className="relative">
                      <ProductImage
                        name={p.name}
                        slug={p.slug}
                        src={p.images[0]}
                        sizes="160px"
                        className="aspect-square w-full rounded-2xl"
                      />
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={i === 0}
                        onChange={() => {
                          const next = new Set(chosen);
                          if (on) next.delete(p.id);
                          else next.add(p.id);
                          setChosen(next);
                        }}
                        className="peer sr-only"
                      />
                      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-white ring-1 ring-brand-300 peer-checked:bg-brand-600 peer-checked:ring-brand-600 peer-focus-visible:outline peer-focus-visible:outline-2">
                        <CheckIcon size={13} strokeWidth={3} />
                      </span>
                    </span>
                    <span className="line-clamp-2 font-semibold leading-snug">
                      {i === 0 ? (
                        <>This: {p.name}</>
                      ) : (
                        <Link href={`/products/${p.slug}`} className="hover:text-brand-600">
                          {p.name}
                        </Link>
                      )}
                    </span>
                    <span className="text-xs text-cocoa-soft">
                      {v.label} ·{' '}
                      <span className="font-bold text-cocoa">{formatMoney(v.price)}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="rounded-2xl bg-brand-50 p-5 text-center ring-1 ring-brand-200 lg:w-64">
            <p className="text-sm text-cocoa-soft">
              {selected.length} item{selected.length > 1 ? 's' : ''} for
            </p>
            <p className="text-2xl font-extrabold tabular-nums">{formatMoney(total)}</p>
            <button
              onClick={() => {
                selected.forEach(({ p, v }) => add(toCartLine(p, v)));
                openCart();
              }}
              className="btn-primary mt-3 w-full"
            >
              Add {selected.length > 1 ? `all ${selected.length}` : ''} to cart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
