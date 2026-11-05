'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { formatMoney } from '@/lib/money';
import { BillDetails, CartLineItem, FreeDeliveryMeter } from '@/components/cart/cart-parts';
import { BagIcon, ChevronRight, CloseIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { deliveryFeeFor } from '@/lib/pricing';

export function CartDrawer() {
  const { lines, count, subtotal, savings, isOpen, closeCart } = useCart();
  const pathname = usePathname();
  const total = subtotal + deliveryFeeFor(subtotal);

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
    <div
      className="fixed inset-0 z-[65]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-cocoa/45 backdrop-blur-[2px]"
        onClick={closeCart}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[26rem] animate-slide-in flex-col bg-brand-50 shadow-float">
        <header className="flex items-center justify-between border-b border-brand-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-2xl font-medium">Your cart</h2>
            {count > 0 && (
              <p className="text-xs text-cocoa-soft">
                {count} item{count > 1 ? 's' : ''} · packed fresh today
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full p-2 transition hover:bg-brand-100"
          >
            <CloseIcon />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <BagIcon size={34} />
            </span>
            <div>
              <p className="font-display text-2xl">Your cart is empty</p>
              <p className="mt-1 text-sm text-cocoa-soft">Fresh mithai is just a tap away.</p>
            </div>
            <Link href="/shop" onClick={closeCart} className="btn-primary mt-2">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <FreeDeliveryMeter subtotal={subtotal} />
              <ul className="divide-y divide-brand-100 rounded-2xl bg-white px-4 ring-1 ring-brand-200">
                {lines.map((l) => (
                  <CartLineItem key={l.variantId} line={l} />
                ))}
              </ul>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-200">
                <BillDetails subtotal={subtotal} savings={savings} />
              </div>
              <Link
                href="/cart"
                className="block text-center text-sm font-semibold text-cocoa-soft underline-offset-4 hover:text-brand-600 hover:underline"
              >
                View full cart
              </Link>
            </div>

            <footer className="border-t border-brand-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Link
                href="/checkout"
                className="flex items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white transition hover:bg-brand-700"
              >
                <span className="flex flex-col leading-tight">
                  <span className="font-extrabold tabular-nums">{formatMoney(total)}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                    Total
                  </span>
                </span>
                <span className="flex items-center gap-1 font-bold">
                  Proceed to checkout <ChevronRight size={18} />
                </span>
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
