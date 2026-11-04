'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { Order } from '@sweets/types';
import { AccountHeader } from '@/components/account/account-nav';
import { ORDER_STATUS, OrderTracker, slugify } from '@/components/account/order-status';
import { ProductImage } from '@/components/product/product-image';
import { ChevronRight, ReceiptIcon } from '@/components/ui/icons';
import { deliveryEstimate } from '@/lib/delivery';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/lib/session';

function Orders() {
  const router = useRouter();
  const placed = useSearchParams().get('placed');
  const { user, ready, api } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    // Older confirmation links (?placed=SW-…) now open the order's own page.
    if (placed) router.replace(`/account/orders/${placed}?placed=1`);
  }, [placed, router]);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login?next=/account/orders');
    else void api.orders.list({ pageSize: 50 }).then((r) => setOrders(r.items));
  }, [ready, user, router, api]);

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <AccountHeader title="My orders" />

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
          const status = ORDER_STATUS[o.status];
          const eta = deliveryEstimate(o);
          return (
            <Link
              key={o.id}
              href={`/account/orders/${o.orderNumber}`}
              className="group block space-y-4 rounded-3xl bg-white p-5 ring-1 ring-brand-200 transition hover:ring-brand-300 sm:p-6"
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

              <OrderTracker status={o.status} fulfillment={o.fulfillment} />
              {eta && <p className="text-xs font-semibold text-pista-600">{eta}</p>}

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

              <div className="flex items-center justify-between border-t border-brand-100 pt-4 text-sm">
                <span className="flex items-center gap-1 font-semibold text-brand-600">
                  View order details
                  <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
                <span>
                  Total{' '}
                  <strong className="ml-1 text-base tabular-nums">{formatMoney(o.total)}</strong>
                </span>
              </div>
            </Link>
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
