'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMoney } from '@/lib/money';
import type { Product } from '@sweets/types';
import { ChevronDown, VegMark } from '@/components/ui/icons';
import { isAvailable, percentOff } from '@/lib/pricing';
import { AddButton } from './add-button';
import { ProductImage } from './product-image';
import { VariantSheet } from './variant-sheet';

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const inStock = product.variants.filter(isAvailable);
  const [variantId, setVariantId] = useState(inStock[0]?.id ?? product.variants[0]?.id);
  const [picking, setPicking] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId);
  const soldOut = inStock.length === 0;
  const off = variant ? percentOff(variant) : 0;
  const href = `/products/${product.slug}`;
  const multi = product.variants.length > 1;
  const lowStock = variant && isAvailable(variant) && (variant.available ?? 0) <= 5;

  return (
    <article className="group relative flex h-full flex-col rounded-[1.25rem] border border-brand-200/80 bg-white p-2 transition duration-300 hover:border-brand-300 hover:shadow-card sm:p-2.5">
      <Link
        href={href}
        className="relative block overflow-hidden rounded-[0.9rem]"
        tabIndex={-1}
        aria-hidden
      >
        <ProductImage
          name={product.name}
          slug={product.slug}
          src={product.images[0]}
          priority={priority}
          className={`aspect-square transition duration-700 ease-out group-hover:scale-[1.04] ${soldOut ? 'opacity-60 grayscale-[40%]' : ''}`}
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && (
            <span className="rounded-md bg-pista-600 px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-white">
              {off}% off
            </span>
          )}
          {product.tags.includes('bestseller') && (
            <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-saffron-600 backdrop-blur">
              Bestseller
            </span>
          )}
        </div>
        {soldOut && (
          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-cocoa/80 py-1.5 text-center text-[0.7rem] font-semibold text-white backdrop-blur">
            Sold out for today
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-0.5 pt-2.5 sm:px-1.5">
        <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-cocoa-soft">
          {product.isVeg && <VegMark size={11} />}
          <span className="truncate">{product.category?.name ?? 'Fresh today'}</span>
        </div>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-[0.92rem] font-semibold leading-tight sm:text-[0.98rem]">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-[1.25rem]">
            {product.name}
          </Link>
        </h3>

        {/* Pack size: a picker when there's a choice, plain text otherwise. */}
        <div className="relative z-10 mt-2">
          {multi ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex w-full items-center justify-between gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-left text-xs font-semibold transition hover:border-cocoa/30"
              aria-haspopup="dialog"
            >
              <span className="truncate">{variant?.label}</span>
              <ChevronDown size={14} className="shrink-0 text-cocoa-soft" />
            </button>
          ) : (
            <p className="px-0.5 py-1.5 text-xs font-semibold text-cocoa-soft">{variant?.label}</p>
          )}
        </div>

        <div className="relative z-10 mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0 leading-none">
            {variant && (
              <>
                <p className="text-[0.95rem] font-extrabold tabular-nums sm:text-base">
                  {formatMoney(variant.price)}
                </p>
                {off > 0 ? (
                  <p className="mt-1 text-[0.7rem] text-cocoa-soft line-through tabular-nums">
                    {formatMoney(variant.mrp!)}
                  </p>
                ) : lowStock ? (
                  <p className="mt-1 text-[0.68rem] font-semibold text-brand-500">
                    Only {variant.available} left
                  </p>
                ) : null}
              </>
            )}
          </div>
          <AddButton product={product} variant={variant} />
        </div>
      </div>

      {multi && (
        <VariantSheet
          product={product}
          open={picking}
          selectedId={variantId}
          onSelect={setVariantId}
          onClose={() => setPicking(false)}
        />
      )}
    </article>
  );
}
