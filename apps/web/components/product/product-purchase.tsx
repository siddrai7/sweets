'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatMoney } from '@/lib/money';
import type { Product } from '@sweets/types';
import { BagIcon, BoltIcon, CheckIcon, StoreIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { isAvailable, percentOff, perKg, toCartLine } from '@/lib/pricing';
import { site } from '@/lib/site';
import { AddButton } from './add-button';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { add, quantityOf, count, subtotal, openCart, loaded } = useCart();
  const firstAvailable = product.variants.find(isAvailable) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);

  const variant = product.variants.find((v) => v.id === variantId);
  const available = variant?.available ?? 0;
  const soldOut = available <= 0;
  const off = variant ? percentOff(variant) : 0;
  const unit = variant ? perKg(variant) : null;
  const inCart = variant && loaded ? quantityOf(variant.id) : 0;

  function buyNow() {
    if (!variant) return;
    if (!inCart) add(toCartLine(product, variant));
    router.push('/checkout');
  }

  return (
    <div className="space-y-7">
      {variant && (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[2rem] font-extrabold tracking-tight tabular-nums">
              {formatMoney(variant.price)}
            </span>
            {off > 0 && (
              <>
                <span className="text-lg text-cocoa-soft line-through tabular-nums">
                  MRP {formatMoney(variant.mrp!)}
                </span>
                <span className="rounded-md bg-pista-600 px-2 py-0.5 text-xs font-extrabold uppercase text-white">
                  {off}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-cocoa-soft">
            {variant.label}
            {unit && ` · ${formatMoney(unit)}/kg`} · Inclusive of all taxes
          </p>
        </div>
      )}

      {product.variants.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cocoa-soft">
            Select pack size
          </legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {product.variants.map((v) => {
              const out = !isAvailable(v);
              const selected = v.id === variantId;
              const vOff = percentOff(v);
              return (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={selected}
                  className={`relative rounded-2xl border bg-white px-4 py-3 text-left transition ${
                    selected
                      ? 'border-cocoa ring-1 ring-cocoa'
                      : 'border-brand-200 hover:border-cocoa/40'
                  } ${out ? 'opacity-50' : ''}`}
                >
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-cocoa text-white">
                      <CheckIcon size={10} strokeWidth={3.5} />
                    </span>
                  )}
                  {vOff > 0 && (
                    <span className="mb-1 inline-block rounded bg-pista-100 px-1.5 text-xs font-extrabold text-pista-600">
                      {vOff}% OFF
                    </span>
                  )}
                  <span className="block text-sm font-bold">{v.label}</span>
                  <span className="block text-sm tabular-nums">
                    {out ? 'Sold out' : formatMoney(v.price)}
                  </span>
                  {perKg(v) && !out && (
                    <span className="block text-xs text-cocoa-soft">
                      {formatMoney(perKg(v)!)}/kg
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {!soldOut && available <= 5 && (
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          Only {available} left for today
        </p>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          {inCart > 0 ? (
            <AddButton product={product} variant={variant} size="lg" />
          ) : (
            <button
              onClick={() => variant && add(toCartLine(product, variant))}
              disabled={soldOut}
              className="btn-primary h-12 w-full whitespace-nowrap rounded-xl px-3 text-[0.95rem]"
            >
              <BagIcon size={18} /> {soldOut ? 'Sold out for today' : 'Add to cart'}
            </button>
          )}
        </div>
        <button
          onClick={inCart > 0 ? openCart : buyNow}
          disabled={soldOut}
          className="btn-outline h-12 flex-1 whitespace-nowrap rounded-xl px-3 text-[0.95rem]"
        >
          {inCart > 0 ? 'View cart' : 'Buy now'}
        </button>
      </div>

      <div className="divide-y divide-brand-200 rounded-2xl bg-white ring-1 ring-brand-200">
        <div className="flex gap-3.5 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-100 text-saffron-600">
            <BoltIcon size={20} />
          </span>
          <div className="text-sm">
            <p className="font-bold">Delivery in {site.delivery.eta}</p>
            <p className="text-cocoa-soft">
              Same-day across {site.delivery.area} on orders before {site.delivery.sameDayCutoff}.
              Free delivery above ₹{site.freeDeliveryAbove}.
            </p>
          </div>
        </div>
        <div className="flex gap-3.5 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pista-100 text-pista-600">
            <StoreIcon size={20} />
          </span>
          <div className="text-sm">
            <p className="font-bold">Free store pickup</p>
            <p className="text-cocoa-soft">
              Ready in {site.delivery.pickupReady} at our Thane shop.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky add bar on phones. */}
      {variant && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-200 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs text-cocoa-soft">{variant.label}</p>
              <p className="font-extrabold tabular-nums">
                {formatMoney(variant.price)}
                {off > 0 && (
                  <span className="ml-1.5 text-xs font-medium text-cocoa-soft line-through">
                    {formatMoney(variant.mrp!)}
                  </span>
                )}
              </p>
            </div>
            <div className="w-36">
              <AddButton product={product} variant={variant} size="lg" label="Add to cart" />
            </div>
            {loaded && count > 0 && (
              <button
                onClick={openCart}
                className="flex h-12 shrink-0 flex-col items-center justify-center rounded-xl bg-cocoa px-3 text-white"
                aria-label={`View cart, ${count} items`}
              >
                <span className="text-xs font-semibold opacity-75">{count} items</span>
                <span className="text-xs font-extrabold tabular-nums">{formatMoney(subtotal)}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
