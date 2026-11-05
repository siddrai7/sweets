'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ReceiptIcon } from '@/components/ui/icons';
import { guestOrders, type GuestOrderRef } from '@/lib/guest-orders';
import { useSession } from '@/lib/session';

/** Guest orders placed on this device; signed-in customers are sent to their order history. */
export default function TrackPage() {
  const { user } = useSession();
  const [orders, setOrders] = useState<GuestOrderRef[] | null>(null);
  useEffect(() => setOrders(guestOrders()), []);

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <p className="eyebrow">Track order</p>
      <h1 className="mt-2 text-4xl font-light sm:text-5xl">Your orders</h1>
      {user && (
        <p className="mt-4 text-sm text-cocoa-soft">
          You’re signed in.{' '}
          <Link href="/account/orders" className="font-bold text-brand-600">
            See all your orders →
          </Link>
        </p>
      )}
      <div className="mt-8 space-y-3">
        {orders?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-brand-300 p-8 text-center text-sm text-cocoa-soft">
            <p className="font-display text-2xl text-cocoa">No orders on this device</p>
            <p className="mt-2">
              Open the private link from your order confirmation, or{' '}
              <Link href="/login?next=/account/orders" className="font-bold text-brand-600">
                sign in
              </Link>{' '}
              to see your order history.
            </p>
          </div>
        )}
        {orders?.map((o) => (
          <Link
            key={o.orderNumber}
            href={`/orders/track/${o.orderNumber}?t=${encodeURIComponent(o.token)}`}
            className="flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-brand-200 transition hover:ring-cocoa/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <ReceiptIcon size={20} />
            </span>
            <span className="flex-1">
              <span className="block font-mono font-semibold">{o.orderNumber}</span>
              <span className="text-xs text-cocoa-soft">
                Placed{' '}
                {new Date(o.placedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </span>
            <span className="text-sm font-bold text-brand-600">Track →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
