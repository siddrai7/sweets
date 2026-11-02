'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { BillDetails, CartLineItem, FreeDeliveryMeter } from '@/components/cart/cart-parts';
import { BagIcon, ChevronRight, LockIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { deliveryFeeFor } from '@/lib/pricing';

export default function CartPage() {
  const { lines, count, subtotal, savings, loaded, clear } = useCart();
  const total = subtotal + deliveryFeeFor(subtotal);

  if (!loaded) return <div className="min-h-[60vh]" />;

  if (!lines.length) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <BagIcon size={40} />
        </span>
        <h1 className="mt-6 text-4xl font-medium">Your cart is empty</h1>
        <p className="mt-3 text-cocoa-soft">Looks like you haven&apos;t added any sweets yet.</p>
        <Link href="/shop" className="btn-primary mt-8">
          Browse sweets
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page pb-32 pt-8 lg:pb-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Step 1 of 2</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Your cart</h1>
        </div>
        <button
          onClick={clear}
          className="text-sm font-semibold text-cocoa-soft underline-offset-4 hover:text-brand-600 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="space-y-4">
          <FreeDeliveryMeter subtotal={subtotal} />
          <ul className="divide-y divide-brand-100 rounded-3xl bg-white px-5 ring-1 ring-brand-200">
            {lines.map((l) => (
              <CartLineItem key={l.variantId} line={l} size="lg" />
            ))}
          </ul>
          <Link
            href="/shop"
            className="inline-flex text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            ← Continue shopping
          </Link>
        </div>

        <aside className="h-fit space-y-5 rounded-3xl bg-white p-6 ring-1 ring-brand-200 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <BillDetails subtotal={subtotal} savings={savings} />
          <Link href="/checkout" className="btn-primary hidden w-full py-4 lg:flex">
            Proceed to checkout
          </Link>
          <p className="flex items-center justify-center gap-1.5 text-xs text-cocoa-soft">
            <LockIcon size={14} /> Secure checkout · Cash on delivery available
          </p>
        </aside>
      </div>

      {/* Sticky checkout bar on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <Link
          href="/checkout"
          className="flex items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white"
        >
          <span className="flex flex-col leading-tight">
            <span className="font-extrabold tabular-nums">{formatMoney(total)}</span>
            <span className="text-[0.7rem] font-semibold opacity-75">
              {count} item{count > 1 ? 's' : ''} · total
            </span>
          </span>
          <span className="flex items-center gap-1 font-bold">
            Checkout <ChevronRight size={18} />
          </span>
        </Link>
      </div>
    </div>
  );
}
