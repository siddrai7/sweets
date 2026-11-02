'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, formatMoney } from '@sweets/api-client';
import type { AddressInput, FulfillmentType } from '@sweets/types';
import { useCart } from '@/lib/cart';
import { useSession } from '@/lib/session';

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
  const { lines, subtotal, clear } = useCart();
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

  if (!ready || !user) return null;
  if (!lines.length) return <p className="container-page py-24 text-center">Your cart is empty.</p>;

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
    <label className="block text-sm">
      {label}
      <input
        {...props}
        value={address[key] ?? ''}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        className="input-field mt-1.5"
      />
    </label>
  );

  return (
    <form
      onSubmit={placeOrder}
      className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_340px]"
    >
      <div className="space-y-5">
        <h1 className="text-4xl font-semibold">Checkout</h1>
        <div className="flex gap-3">
          {(['DELIVERY', 'PICKUP'] as const).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFulfillment(f)}
              className={`rounded-full px-5 py-2 text-sm ${fulfillment === f ? 'bg-brand-600 text-white' : 'bg-white'}`}
            >
              {f === 'DELIVERY' ? 'Home delivery' : 'Store pickup'}
            </button>
          ))}
        </div>
        {fulfillment === 'DELIVERY' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {field('name', 'Full name', { required: true })}
            {field('phone', 'Phone', { required: true, inputMode: 'tel' })}
            <div className="sm:col-span-2">{field('line1', 'Address', { required: true })}</div>
            <div className="sm:col-span-2">{field('line2', 'Landmark (optional)')}</div>
            {field('city', 'City', { required: true })}
            {field('state', 'State', { required: true })}
            {field('pincode', 'Pincode', {
              required: true,
              inputMode: 'numeric',
              pattern: '\\d{6}',
            })}
          </div>
        )}
        <p className="rounded-xl bg-white p-4 text-sm">
          💵 Payment: Cash on delivery (online payments coming soon)
        </p>
      </div>
      <aside className="h-fit space-y-3 rounded-3xl border border-brand-200 bg-white p-6">
        <h2 className="font-semibold">Order summary</h2>
        {lines.map((l) => (
          <div key={l.variantId} className="flex justify-between text-sm">
            <span>
              {l.productName} ({l.variantLabel}) × {l.quantity}
            </span>
            <span>{formatMoney(Number(l.unitPrice) * l.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-brand-100 pt-3 font-semibold">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </aside>
    </form>
  );
}
