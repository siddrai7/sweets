'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { Product } from '@sweets/types';
import { VegMark } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { ProductImage } from './product-image';

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const inStock = product.variants.filter((v) => (v.available ?? 0) > 0);
  const [variantId, setVariantId] = useState(inStock[0]?.id ?? product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === variantId);
  const soldOut = inStock.length === 0;
  const onSale = variant?.mrp && Number(variant.mrp) > Number(variant.price);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block" tabIndex={-1}>
        <ProductImage
          name={product.name}
          slug={product.slug}
          src={product.images[0]}
          priority={priority}
          className="aspect-square transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.tags.includes('bestseller') && (
            <span className="rounded-full bg-saffron-500 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-cocoa">
              Bestseller
            </span>
          )}
          {onSale && (
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">
              Sale
            </span>
          )}
        </div>
        {soldOut && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-cocoa/80 py-1.5 text-center text-xs font-semibold text-white">
            Sold out for today
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-2">
          {product.isVeg && (
            <span className="mt-1.5 shrink-0">
              <VegMark size={12} />
            </span>
          )}
          <h3 className="font-display text-lg leading-snug">
            <Link href={`/products/${product.slug}`} className="hover:text-brand-600">
              {product.name}
            </Link>
          </h3>
        </div>

        {product.variants.length > 1 && (
          <div
            className="flex flex-wrap gap-1.5"
            role="radiogroup"
            aria-label={`${product.name} size`}
          >
            {product.variants.map((v) => {
              const available = (v.available ?? 0) > 0;
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={v.id === variantId}
                  disabled={!available}
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    v.id === variantId
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-brand-200 hover:border-brand-600'
                  } disabled:cursor-not-allowed disabled:line-through disabled:opacity-40`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {product.variants.length === 1 && (
              <p className="text-xs text-cocoa-soft">{variant?.label}</p>
            )}
            <p className="text-lg font-bold">
              {variant && formatMoney(variant.price)}
              {onSale && (
                <span className="ml-2 text-sm font-normal text-cocoa-soft line-through">
                  {formatMoney(variant!.mrp!)}
                </span>
              )}
            </p>
          </div>
          <button
            disabled={soldOut || !variant || (variant.available ?? 0) <= 0}
            onClick={() =>
              variant &&
              add({
                variantId: variant.id,
                productSlug: product.slug,
                productName: product.name,
                variantLabel: variant.label,
                unitPrice: variant.price,
                image: product.images[0],
                maxQuantity: variant.available,
              })
            }
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-cocoa-soft"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
