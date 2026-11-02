'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { formatMoney } from '@/lib/money';
import type { Order } from '@sweets/types';
import { ProductImage } from '@/components/product/product-image';
import { CheckIcon, LogoutIcon, ReceiptIcon } from '@/components/ui/icons';
import { useSession } from '@/lib/session';

const STATUS: Record<Order['status'], { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'bg-saffron-100 text-saffron-600' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-saffron-100 text-saffron-600' },
  PREPARING: { label: 'Being prepared', tone: 'bg-saffron-100 text-saffron-600' },
  READY: { label: 'Ready', tone: 'bg-pista-100 text-pista-600' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'bg-pista-100 text-pista-600' },
  DELIVERED: { label: 'Delivered', tone: 'bg-pista-100 text-pista-700' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-brand-100 text-brand-600' },
  REFUNDED: { label: 'Refunded', tone: 'bg-brand-100 text-cocoa-soft' },
};

/** Progress tracker stages for an active order. */
const STAGES: { status: Order['status'][]; label: string }[] = [
  { status: ['PENDING_PAYMENT', 'CONFIRMED'], label: 'Confirmed' },
  { status: ['PREPARING'], label: 'Preparing' },
  { status: ['READY', 'OUT_FOR_DELIVERY'], label: 'On the way' },
  { status: ['DELIVERED'], label: 'Delivered' },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function Tracker({ status }: { status: Order['status'] }) {
  const current = STAGES.findIndex((s) => s.status.includes(status));
  if (current < 0) return null;
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {STAGES.map((s, i) => (
        <li key={s.label}>
          <span
            className={`block h-1.5 rounded-full ${i <= current ? 'bg-pista-500' : 'bg-brand-100'}`}
          />
          <span
            className={`mt-1.5 block text-[0.68rem] font-semibold ${i <= current ? 'text-cocoa' : 'text-cocoa-soft/70'}`}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Orders() {
  const router = useRouter();
  const placed = useSearchParams().get('placed');
  const { user, ready, api, signOut } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);

  const load = useCallback(
    () => api.orders.list({ pageSize: 50 }).then((r) => setOrders(r.items)),
    [api],
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login?next=/account/orders');
    else void load();
  }, [ready, user, router, load]);

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      {placed && (
        <div className="mb-8 flex animate-rise items-center gap-4 rounded-3xl bg-pista-50 p-5 ring-1 ring-pista-100">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pista-500 text-white">
            <CheckIcon size={24} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display text-xl">Order placed. Thank you!</p>
            <p className="text-sm text-cocoa-soft">
              Order <strong className="font-mono text-cocoa">{placed}</strong> is confirmed. Our
              kitchen will start preparing it shortly.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{user ? `Hello, ${user.name.split(' ')[0]}` : 'Account'}</p>
          <h1 className="mt-2 text-4xl font-light sm:text-5xl">My orders</h1>
        </div>
        {user && (
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-1.5 text-sm font-semibold text-cocoa-soft hover:text-brand-600"
          >
            <LogoutIcon size={16} /> Sign out
          </button>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {!orders &&
          [0, 1].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-3xl bg-white ring-1 ring-brand-200"
            />
          ))}

        {orders?.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-brand-300 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <ReceiptIcon size={28} />
            </span>
            <p className="mt-4 font-display text-2xl">No orders yet</p>
            <p className="mt-1 text-sm text-cocoa-soft">Your first box of mithai is a tap away.</p>
            <Link href="/shop" className="btn-primary mt-6">
              Start shopping
            </Link>
          </div>
        )}

        {orders?.map((o) => {
          const status = STATUS[o.status];
          return (
            <article
              key={o.id}
              className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-cocoa-soft">
                    {new Date(o.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>
                  {status.label}
                </span>
              </div>

              <Tracker status={o.status} />

              <ul className="flex flex-wrap gap-2">
                {o.items.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-2 rounded-xl bg-brand-50 py-1.5 pl-1.5 pr-3 text-xs ring-1 ring-brand-100"
                  >
                    <ProductImage
                      name={i.productName}
                      slug={slugify(i.productName)}
                      sizes="32px"
                      className="h-8 w-8 rounded-lg"
                    />
                    <span>
                      <span className="font-semibold">{i.productName}</span>
                      <span className="text-cocoa-soft">
                        {' '}
                        · {i.variantLabel} × {i.quantity}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-brand-100 pt-4">
                {o.status === 'PENDING_PAYMENT' || o.status === 'CONFIRMED' ? (
                  <button
                    onClick={() => {
                      if (window.confirm('Cancel this order?'))
                        void api.orders.cancel(o.id).then(load);
                    }}
                    className="text-sm font-semibold text-cocoa-soft underline-offset-4 hover:text-brand-600 hover:underline"
                  >
                    Cancel order
                  </button>
                ) : (
                  <span />
                )}
                <span className="text-sm">
                  Total{' '}
                  <strong className="ml-1 text-base tabular-nums">{formatMoney(o.total)}</strong>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}
