'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { formatMoney } from '@/lib/money';
import type { AddressInput, FulfillmentType } from '@sweets/types';
import { BillDetails } from '@/components/cart/cart-parts';
import { ProductImage } from '@/components/product/product-image';
import {
  CardIcon,
  CashIcon,
  CheckIcon,
  ChevronRight,
  LockIcon,
  StoreIcon,
  TruckIcon,
} from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { deliveryFeeFor } from '@/lib/pricing';
import { useSession } from '@/lib/session';
import { site } from '@/lib/site';

const emptyAddress: AddressInput = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, count, subtotal, savings, clear, loaded } = useCart();
  const { user, ready, api } = useSession();
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('DELIVERY');
  const [address, setAddress] = useState<AddressInput>(emptyAddress);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace('/login?next=/checkout');
  }, [ready, user, router]);

  useEffect(() => {
    if (user)
      setAddress((a) => ({
        ...a,
        name: a.name || user.name,
        phone: a.phone || (user.phone ?? ''),
      }));
  }, [user]);

  if (!ready || !user || !loaded) return <div className="min-h-[60vh]" />;
  if (!lines.length) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-4xl font-light">Your cart is empty</h1>
        <Link href="/shop" className="btn-primary mt-8">
          Browse sweets
        </Link>
      </div>
    );
  }

  const total = subtotal + deliveryFeeFor(subtotal, fulfillment);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { order } = await api.orders.place({
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        fulfillment,
        address:
          fulfillment === 'DELIVERY'
            ? { ...address, line2: address.line2 || undefined }
            : undefined,
        paymentProvider: 'COD',
        channel: 'WEB',
      });
      clear();
      router.push(`/account/orders?placed=${order.orderNumber}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong, please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = (
    key: keyof AddressInput,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">{label}</span>
      <input
        {...props}
        value={address[key] ?? ''}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        className="input-field"
      />
    </label>
  );

  const submitLabel = submitting ? 'Placing order…' : `Place order · ${formatMoney(total)}`;

  return (
    <form id="checkout" onSubmit={placeOrder} className="container-page pb-36 pt-8 lg:pb-16">
      <p className="eyebrow">Step 2 of 2</p>
      <h1 className="mt-2 text-4xl font-light sm:text-5xl">Checkout</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-5">
          <Step n={1} title="How would you like it?">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: 'DELIVERY',
                    icon: TruckIcon,
                    title: 'Home delivery',
                    body: `In ${site.delivery.eta} · ${subtotal >= site.freeDeliveryAbove ? 'Free' : formatMoney(site.deliveryFee)}`,
                  },
                  {
                    value: 'PICKUP',
                    icon: StoreIcon,
                    title: 'Store pickup',
                    body: `Ready in ${site.delivery.pickupReady} · Free`,
                  },
                ] as const
              ).map((o) => {
                const on = fulfillment === o.value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setFulfillment(o.value)}
                    aria-pressed={on}
                    className={`relative flex items-center gap-3.5 rounded-2xl border bg-white p-4 text-left transition ${on ? 'border-cocoa ring-1 ring-cocoa' : 'border-brand-200 hover:border-cocoa/40'}`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-brand-600 text-white' : 'bg-brand-100 text-cocoa-soft'}`}
                    >
                      <o.icon size={20} />
                    </span>
                    <span>
                      <span className="block font-bold">{o.title}</span>
                      <span className="text-xs text-cocoa-soft">{o.body}</span>
                    </span>
                    {on && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cocoa text-white">
                        <CheckIcon size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n={2} title={fulfillment === 'DELIVERY' ? 'Delivery address' : 'Pickup from'}>
            {fulfillment === 'DELIVERY' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {field('name', 'Full name', { required: true, autoComplete: 'name' })}
                {field('phone', 'Mobile number', {
                  required: true,
                  inputMode: 'tel',
                  autoComplete: 'tel',
                })}
                <div className="sm:col-span-2">
                  {field('line1', 'Flat, building, street', {
                    required: true,
                    autoComplete: 'address-line1',
                  })}
                </div>
                <div className="sm:col-span-2">
                  {field('line2', 'Landmark (optional)', { autoComplete: 'address-line2' })}
                </div>
                {field('pincode', 'Pincode', {
                  required: true,
                  inputMode: 'numeric',
                  pattern: '\\d{6}',
                  maxLength: 6,
                  autoComplete: 'postal-code',
                })}
                {field('city', 'City', { required: true, autoComplete: 'address-level2' })}
                <div className="sm:col-span-2">
                  {field('state', 'State', { required: true, autoComplete: 'address-level1' })}
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-2xl bg-brand-50 p-4 text-sm ring-1 ring-brand-200">
                <StoreIcon size={20} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <p className="font-bold">{site.name}</p>
                  <p className="text-cocoa-soft">{site.contact.address}</p>
                  <p className="mt-1 text-cocoa-soft">{site.contact.hours}</p>
                </div>
              </div>
            )}
          </Step>

          <Step n={3} title="Payment">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3.5 rounded-2xl border border-cocoa bg-white p-4 ring-1 ring-cocoa">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pista-100 text-pista-600">
                  <CashIcon size={20} />
                </span>
                <span className="flex-1">
                  <span className="block font-bold">
                    {fulfillment === 'DELIVERY' ? 'Cash on delivery' : 'Pay at the store'}
                  </span>
                  <span className="text-xs text-cocoa-soft">
                    Cash or UPI when you receive your order
                  </span>
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cocoa text-white">
                  <CheckIcon size={12} strokeWidth={3} />
                </span>
              </div>
              <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-brand-300 p-4 opacity-60">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
                  <CardIcon size={20} />
                </span>
                <span>
                  <span className="block font-bold">UPI, cards & netbanking</span>
                  <span className="text-xs text-cocoa-soft">Coming soon</span>
                </span>
              </div>
            </div>
          </Step>
        </div>

        <aside className="h-fit space-y-5 rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-normal">Order summary</h2>
            <Link href="/cart" className="text-xs font-bold text-brand-600">
              Edit
            </Link>
          </div>
          <ul className="max-h-64 space-y-3 overflow-y-auto">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-3 text-sm">
                <span className="relative shrink-0">
                  <ProductImage
                    name={l.productName}
                    slug={l.productSlug}
                    src={l.image}
                    sizes="48px"
                    className="h-12 w-12 rounded-xl"
                  />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cocoa px-1 text-[0.62rem] font-bold text-white">
                    {l.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{l.productName}</span>
                  <span className="text-xs text-cocoa-soft">{l.variantLabel}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(Number(l.unitPrice) * l.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-brand-100 pt-4">
            <BillDetails subtotal={subtotal} savings={savings} fulfillment={fulfillment} />
          </div>
          {error && (
            <p
              className="rounded-xl bg-brand-100 px-3 py-2.5 text-sm font-medium text-brand-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <button disabled={submitting} className="btn-primary hidden w-full py-4 lg:flex">
            {submitLabel}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-cocoa-soft">
            <LockIcon size={14} /> Your details are safe with us
          </p>
        </aside>
      </div>

      {/* Sticky place-order bar on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <button
          disabled={submitting}
          className="flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white disabled:opacity-60"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="font-extrabold tabular-nums">{formatMoney(total)}</span>
            <span className="text-[0.7rem] font-semibold opacity-75">
              {count} item{count > 1 ? 's' : ''} · cash on delivery
            </span>
          </span>
          <span className="flex items-center gap-1 font-bold">
            {submitting ? 'Placing…' : 'Place order'} <ChevronRight size={18} />
          </span>
        </button>
      </div>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-normal">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 font-sans text-xs font-bold text-brand-600">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
