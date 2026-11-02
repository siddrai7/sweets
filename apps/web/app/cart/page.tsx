'use client';

import Link from 'next/link';
import { formatMoney } from '@sweets/api-client';
import { ProductImage } from '@/components/product/product-image';
import { MinusIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { site } from '@/lib/site';

export default function CartPage() {
  const { lines, subtotal, setQuantity } = useCart();

  if (!lines.length) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-4xl font-semibold">Your cart is empty</h1>
        <p className="mt-3 text-cocoa-soft">Looks like you haven&apos;t added any sweets yet.</p>
        <Link href="/shop" className="btn-primary mt-8">
          Browse sweets
        </Link>
      </div>
    );
  }

  const remaining = Math.max(0, site.freeDeliveryAbove - subtotal);

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-semibold">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-brand-200 rounded-3xl border border-brand-200 bg-white px-5">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-4 py-5">
              <Link href={`/products/${l.productSlug}`} className="shrink-0">
                <ProductImage
                  name={l.productName}
                  slug={l.productSlug}
                  src={l.image}
                  sizes="96px"
                  className="h-24 w-24 rounded-2xl"
                />
              </Link>
              <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <Link
                    href={`/products/${l.productSlug}`}
                    className="font-display text-lg font-semibold hover:text-brand-600"
                  >
                    {l.productName}
                  </Link>
                  <p className="text-sm text-cocoa-soft">
                    {l.variantLabel} · {formatMoney(l.unitPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center rounded-full border border-brand-200">
                    <button
                      onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                      className="p-2.5"
                      aria-label="Decrease quantity"
                    >
                      {l.quantity === 1 ? <TrashIcon size={16} /> : <MinusIcon size={16} />}
                    </button>
                    <span className="w-6 text-center">{l.quantity}</span>
                    <button
                      onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                      disabled={l.maxQuantity !== undefined && l.quantity >= l.maxQuantity}
                      className="p-2.5 disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                  <span className="w-24 text-right font-semibold">
                    {formatMoney(Number(l.unitPrice) * l.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-3xl border border-brand-200 bg-white p-6 lg:sticky lg:top-28">
          <h2 className="text-2xl font-semibold">Summary</h2>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <p className="text-sm text-cocoa-soft">
            {remaining > 0
              ? `Add ${formatMoney(remaining)} more for free delivery.`
              : 'You get free delivery!'}{' '}
            Prices include GST.
          </p>
          <Link href="/checkout" className="btn-primary w-full">
            Proceed to checkout
          </Link>
          <Link
            href="/shop"
            className="block text-center text-sm text-cocoa-soft hover:text-brand-600"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
