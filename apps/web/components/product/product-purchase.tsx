'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { Product } from '@sweets/types';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const firstAvailable =
    product.variants.find((v) => (v.available ?? 0) > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find((v) => v.id === variantId);
  const available = variant?.available ?? 0;
  const soldOut = available <= 0;
  const savings = variant?.mrp ? Number(variant.mrp) - Number(variant.price) : 0;

  function addToCart(open: boolean) {
    if (!variant) return;
    add(
      {
        variantId: variant.id,
        productSlug: product.slug,
        productName: product.name,
        variantLabel: variant.label,
        unitPrice: variant.price,
        image: product.images[0],
        maxQuantity: variant.available,
      },
      quantity,
      { open },
    );
  }

  return (
    <div className="space-y-6">
      {variant && (
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatMoney(variant.price)}</span>
            {savings > 0 && (
              <>
                <span className="text-lg text-cocoa-soft line-through">
                  {formatMoney(variant.mrp!)}
                </span>
                <span className="rounded-full bg-pista-100 px-2.5 py-0.5 text-sm font-semibold text-pista-600">
                  Save {formatMoney(savings)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-cocoa-soft">Inclusive of all taxes</p>
        </div>
      )}

      {product.variants.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            Size: <span className="font-normal text-cocoa-soft">{variant?.label}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const out = (v.available ?? 0) <= 0;
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                  }}
                  aria-pressed={selected}
                  className={`relative min-w-24 rounded-2xl border-2 px-4 py-2.5 text-left transition ${
                    selected
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-brand-200 bg-white hover:border-brand-300'
                  } ${out ? 'opacity-50' : ''}`}
                >
                  <span className="block text-sm font-semibold">{v.label}</span>
                  <span className="block text-xs text-cocoa-soft">
                    {out ? 'Sold out' : formatMoney(v.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {!soldOut && available <= 5 && (
        <p className="text-sm font-medium text-saffron-600">
          Only {available} left for today. Order soon!
        </p>
      )}

      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex items-center rounded-full border border-brand-200 bg-white">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={soldOut || quantity <= 1}
            className="p-3.5 disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <MinusIcon size={16} />
          </button>
          <span className="w-8 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(available, q + 1))}
            disabled={soldOut || quantity >= available}
            className="p-3.5 disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <PlusIcon size={16} />
          </button>
        </div>
        <button onClick={() => addToCart(true)} disabled={soldOut} className="btn-outline flex-1">
          {soldOut ? 'Sold out for today' : 'Add to cart'}
        </button>
        <button
          onClick={() => {
            addToCart(false);
            router.push('/checkout');
          }}
          disabled={soldOut}
          className="btn-primary w-full sm:w-auto sm:flex-1"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
