'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ApiError } from '@sweets/api-client';
import type { Order } from '@sweets/types';
import {
  CUSTOMER_CANCELLABLE,
  ORDER_STATUS,
  OrderTracker,
  slugify,
} from '@/components/account/order-status';
import { ProductImage } from '@/components/product/product-image';
import {
  ArrowLeft,
  CashIcon,
  CheckIcon,
  ClockIcon,
  PinIcon,
  StoreIcon,
  WhatsAppIcon,
} from '@/components/ui/icons';
import { deliveryEstimate } from '@/lib/delivery';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/lib/session';
import { site } from '@/lib/site';

const FINISHED: Order['status'][] = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

function OrderDetail() {
  const { number } = useParams<{ number: string }>();
  const placed = useSearchParams().get('placed') === '1';
  const router = useRouter();
  const { user, ready, api } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(
    () =>
      api.orders
        .get(number)
        .then(setOrder)
        .catch((e) => {
          if (e instanceof ApiError && e.status === 404) setMissing(true);
        }),
    [api, number],
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=/account/orders/${number}`);
    else void load();
  }, [ready, user, router, number, load]);

  // Keep the status fresh while the kitchen and delivery team work on it.
  useEffect(() => {
    if (!order || FINISHED.includes(order.status)) return;
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [order, load]);

  if (missing) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-4xl font-light">We couldn’t find that order</h1>
        <p className="mt-3 text-cocoa-soft">Check the order number, or see all your orders.</p>
        <Link href="/account/orders" className="btn-primary mt-8">
          My orders
        </Link>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container-page max-w-3xl space-y-4 py-12" aria-busy>
        <div className="h-40 animate-pulse rounded-3xl bg-brand-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-white ring-1 ring-brand-200" />
      </div>
    );
  }

  const status = ORDER_STATUS[order.status];
  const eta = deliveryEstimate(order);
  const address = order.address;
  const payment = order.payments?.[0];
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const cancellable = CUSTOMER_CANCELLABLE.includes(order.status);
  const help = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(
    `Hi ${site.name}, I need help with my order ${order.orderNumber}.`,
  )}`;

  async function cancel() {
    if (!window.confirm('Cancel this order? This can’t be undone.')) return;
    setCancelling(true);
    try {
      setOrder(await api.orders.cancel(order!.id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Couldn’t cancel the order.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-cocoa-soft hover:text-brand-600"
      >
        <ArrowLeft size={16} /> My orders
      </Link>

      {/* Header: a celebratory confirmation right after checkout, a status card otherwise. */}
      {placed && order.status !== 'CANCELLED' ? (
        <section className="mt-5 animate-rise overflow-hidden rounded-[2rem] bg-brand-900 p-6 text-brand-100 sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pista-500 text-white">
            <CheckIcon size={28} strokeWidth={2.5} />
          </span>
          <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-saffron-400">
            Order confirmed
          </p>
          <h1 className="mt-2 text-[2.2rem] font-light leading-tight text-white sm:text-5xl">
            Thank you, <em className="text-saffron-300">{user?.name.split(' ')[0]}</em>!
          </h1>
          <p className="mt-3 max-w-lg text-brand-300">
            We’ve received your order and our kitchen will start on it shortly. We’ll call{' '}
            {address?.phone ?? 'you'} if we need anything.
          </p>
        </section>
      ) : (
        <h1 className="mt-5 text-4xl font-light sm:text-5xl">Order details</h1>
      )}

      <section className="mt-5 space-y-5 rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa-soft">
              Order number
            </p>
            <button
              onClick={() =>
                navigator.clipboard?.writeText(order.orderNumber).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                })
              }
              className="mt-0.5 font-mono text-lg font-semibold hover:text-brand-600"
              title="Copy order number"
            >
              {order.orderNumber}
              <span className="ml-2 font-sans text-xs font-semibold text-cocoa-soft">
                {copied ? 'Copied ✓' : 'Copy'}
              </span>
            </button>
            <p className="text-xs text-cocoa-soft">
              Placed{' '}
              {new Date(order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>
            {status.label}
          </span>
        </div>
        <OrderTracker status={order.status} fulfillment={order.fulfillment} size="lg" />
        {eta && (
          <p className="flex items-center gap-2 rounded-2xl bg-pista-50 px-4 py-3 text-sm font-semibold text-pista-700 ring-1 ring-pista-100">
            <ClockIcon size={18} /> {eta}
          </p>
        )}
      </section>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
          {order.fulfillment === 'DELIVERY' && address ? (
            <>
              <h2 className="flex items-center gap-2 font-sans text-sm font-bold">
                <PinIcon size={16} className="text-brand-600" /> Delivering to
              </h2>
              <p className="mt-3 text-sm font-semibold">{address.name}</p>
              <p className="text-sm text-cocoa-soft">
                {[address.line1, address.line2].filter(Boolean).join(', ')}
                <br />
                {address.city}, {address.state} {address.pincode}
              </p>
              <p className="mt-1 text-sm text-cocoa-soft">{address.phone}</p>
            </>
          ) : (
            <>
              <h2 className="flex items-center gap-2 font-sans text-sm font-bold">
                <StoreIcon size={16} className="text-brand-600" /> Pick up from
              </h2>
              <p className="mt-3 text-sm font-semibold">{site.name}</p>
              <p className="text-sm text-cocoa-soft">{site.contact.address}</p>
              <p className="mt-1 text-sm text-cocoa-soft">{site.contact.hours}</p>
            </>
          )}
        </section>
        <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
          <h2 className="flex items-center gap-2 font-sans text-sm font-bold">
            <CashIcon size={16} className="text-brand-600" /> Payment
          </h2>
          <p className="mt-3 text-sm font-semibold">
            {payment?.provider === 'COD' || !payment
              ? order.fulfillment === 'PICKUP'
                ? 'Pay at the store'
                : 'Cash on delivery'
              : payment.provider}
          </p>
          <p className="text-sm text-cocoa-soft">
            {payment?.status === 'SUCCEEDED'
              ? `Paid ${formatMoney(order.total)}`
              : order.status === 'CANCELLED'
                ? 'Nothing to pay'
                : `Please keep ${formatMoney(order.total)} ready (cash or UPI).`}
          </p>
        </section>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
        <h2 className="font-sans text-sm font-bold">
          {itemCount} item{itemCount > 1 ? 's' : ''}
        </h2>
        <ul className="mt-2 divide-y divide-brand-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
              <ProductImage
                name={i.productName}
                slug={slugify(i.productName)}
                sizes="56px"
                className="h-14 w-14 shrink-0 rounded-xl"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{i.productName}</span>
                <span className="text-xs text-cocoa-soft">
                  {i.variantLabel} · {formatMoney(i.unitPrice)} × {i.quantity}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{formatMoney(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-dashed border-brand-300 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-cocoa-soft">Item total</dt>
            <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between text-pista-600">
              <dt>Discount</dt>
              <dd className="tabular-nums">− {formatMoney(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-cocoa-soft">
              {order.fulfillment === 'PICKUP' ? 'Store pickup' : 'Delivery fee'}
            </dt>
            <dd className="tabular-nums">
              {Number(order.deliveryFee) > 0 ? (
                formatMoney(order.deliveryFee)
              ) : (
                <span className="font-semibold text-pista-600">FREE</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-extrabold">
            <dt>{payment?.status === 'SUCCEEDED' ? 'Paid' : 'To pay'}</dt>
            <dd className="tabular-nums">{formatMoney(order.total)}</dd>
          </div>
          <p className="text-[0.7rem] text-cocoa-soft">
            Includes {formatMoney(order.taxTotal)} GST.
          </p>
        </dl>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
        <a href={help} target="_blank" rel="noreferrer" className="btn-ghost">
          <WhatsAppIcon size={18} /> Help with this order
        </a>
        {cancellable && (
          <button
            onClick={cancel}
            disabled={cancelling}
            className="ml-auto text-sm font-semibold text-cocoa-soft underline-offset-4 hover:text-brand-600 hover:underline disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}
