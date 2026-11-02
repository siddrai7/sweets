'use client';

import type { Product, ProductVariant } from '@sweets/types';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { isAvailable, toCartLine } from '@/lib/pricing';

const SIZES = {
  sm: { box: 'h-9 min-w-[5.25rem] text-[0.8rem]', icon: 14, pad: 'w-7' },
  md: { box: 'h-11 min-w-28 text-sm', icon: 16, pad: 'w-9' },
  lg: { box: 'h-12 w-full text-[0.95rem]', icon: 18, pad: 'w-12' },
};

/**
 * Quick-commerce style ADD button: one tap adds, then it becomes a − n + stepper in place,
 * so customers can build a cart without leaving the page they're browsing.
 */
export function AddButton({
  product,
  variant,
  size = 'sm',
  label = 'Add',
}: {
  product: Product;
  variant: ProductVariant | undefined;
  size?: keyof typeof SIZES;
  label?: string;
}) {
  const { add, setQuantity, quantityOf, loaded } = useCart();
  const s = SIZES[size];
  const quantity = variant && loaded ? quantityOf(variant.id) : 0;
  const soldOut = !variant || !isAvailable(variant);
  const max = variant?.available ?? 0;

  if (soldOut) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl border border-brand-200 bg-brand-100 px-3 font-semibold text-cocoa-soft ${s.box}`}
      >
        Sold out
      </span>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => add(toCartLine(product, variant))}
        className={`inline-flex items-center justify-center gap-1 rounded-xl border border-brand-600 bg-white px-3 font-bold uppercase tracking-wide text-brand-600 shadow-[0_1px_0_rgb(125_27_40/0.15)] transition hover:bg-brand-600 hover:text-white active:scale-95 ${s.box}`}
        aria-label={`Add ${product.name}, ${variant.label}, to cart`}
      >
        {label}
        {size !== 'lg' && <PlusIcon size={s.icon - 2} strokeWidth={2.5} />}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex animate-pop items-center justify-between rounded-xl bg-brand-600 font-bold text-white shadow-[0_6px_16px_-8px_rgb(125_27_40/0.8)] ${s.box}`}
      role="group"
      aria-label={`${product.name}, ${variant.label}: ${quantity} in cart`}
    >
      <button
        type="button"
        onClick={() => setQuantity(variant.id, quantity - 1)}
        className={`flex h-full items-center justify-center rounded-l-xl transition hover:bg-white/10 ${s.pad}`}
        aria-label="Remove one"
      >
        <MinusIcon size={s.icon} strokeWidth={2.5} />
      </button>
      <span aria-live="polite" className="min-w-5 text-center tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => setQuantity(variant.id, quantity + 1)}
        disabled={quantity >= max}
        className={`flex h-full items-center justify-center rounded-r-xl transition hover:bg-white/10 disabled:opacity-40 ${s.pad}`}
        aria-label="Add one more"
      >
        <PlusIcon size={s.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
