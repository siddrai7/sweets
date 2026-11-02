'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { formatMoney } from '@sweets/api-client';
import { ProductImage } from '@/components/product/product-image';
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { site } from '@/lib/site';

export function CartDrawer() {
  const { lines, subtotal, isOpen, closeCart, setQuantity } = useCart();
  const pathname = usePathname();
  const remaining = Math.max(0, site.freeDeliveryAbove - subtotal);
  const progress = Math.min(100, (subtotal / site.freeDeliveryAbove) * 100);

  // Close on navigation and on Escape; lock page scroll while open.
  useEffect(() => closeCart(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 animate-fade-in bg-cocoa/40" onClick={closeCart} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-brand-50 shadow-2xl">
        <header className="flex items-center justify-between border-b border-brand-200 px-5 py-4">
          <h2 className="text-xl font-semibold">Your cart</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full p-2 hover:bg-brand-100"
          >
            <CloseIcon />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="rounded-full bg-brand-100 p-5 text-brand-600">
              <BagIcon size={32} />
            </span>
            <p className="font-display text-xl">Your cart is empty</p>
            <Link href="/shop" className="btn-primary">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-brand-200 px-5 py-3 text-sm">
              {remaining > 0 ? (
                <p>
                  Add <strong>{formatMoney(remaining)}</strong> more for{' '}
                  <strong>free delivery</strong>
                </p>
              ) : (
                <p className="font-medium text-pista-600">You&apos;ve unlocked free delivery 🎉</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-200">
                <div
                  className="h-full rounded-full bg-saffron-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-brand-200 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-4">
                  <Link href={`/products/${l.productSlug}`} className="shrink-0">
                    <ProductImage
                      name={l.productName}
                      slug={l.productSlug}
                      src={l.image}
                      sizes="80px"
                      className="h-20 w-20 rounded-xl"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${l.productSlug}`}
                      className="truncate font-medium hover:text-brand-600"
                    >
                      {l.productName}
                    </Link>
                    <span className="text-sm text-cocoa-soft">{l.variantLabel}</span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-brand-200 bg-white">
                        <button
                          onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                          className="p-2"
                          aria-label="Decrease quantity"
                        >
                          {l.quantity === 1 ? <TrashIcon size={14} /> : <MinusIcon size={14} />}
                        </button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <button
                          onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                          disabled={l.maxQuantity !== undefined && l.quantity >= l.maxQuantity}
                          className="p-2 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                      <span className="font-semibold">
                        {formatMoney(Number(l.unitPrice) * l.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t border-brand-200 bg-white px-5 py-4">
              <div className="flex justify-between text-base">
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <p className="text-xs text-cocoa-soft">
                Prices include GST. Delivery is calculated at checkout.
              </p>
              <Link href="/checkout" className="btn-primary w-full">
                Checkout
              </Link>
              <Link
                href="/cart"
                className="block text-center text-sm text-cocoa-soft underline-offset-4 hover:underline"
              >
                View full cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
