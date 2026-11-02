'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { Order } from '@sweets/types';
import { useSession } from '@/lib/session';

const STATUS_LABEL: Record<Order['status'], string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Being prepared',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

function Orders() {
  const router = useRouter();
  const placed = useSearchParams().get('placed');
  const { user, ready, api } = useSession();
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

  if (!orders) return <p className="container-page py-16 text-cocoa-soft">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      {placed && (
        <div className="rounded-2xl bg-green-50 p-4 text-green-900">
          🎉 Order <strong>{placed}</strong> placed! We&apos;ll start preparing it shortly.
        </div>
      )}
      <h1 className="text-4xl font-semibold">My orders</h1>
      {orders.length === 0 && <p className="text-cocoa/60">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="space-y-2 rounded-2xl border border-brand-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">{o.orderNumber}</span>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold">
              {STATUS_LABEL[o.status]}
            </span>
          </div>
          <p className="text-sm text-cocoa/70">
            {o.items.map((i) => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(', ')}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>{new Date(o.createdAt).toLocaleString('en-IN')}</span>
            <span className="font-semibold">{formatMoney(o.total)}</span>
          </div>
          {(o.status === 'PENDING_PAYMENT' || o.status === 'CONFIRMED') && (
            <button
              onClick={() => api.orders.cancel(o.id).then(load)}
              className="text-sm text-red-700 underline"
            >
              Cancel order
            </button>
          )}
        </div>
      ))}
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
