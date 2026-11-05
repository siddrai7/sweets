'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { formatMoney } from '@/lib/money';
import type {
  AddressInput,
  CouponPreview,
  DeliverySlot,
  FulfillmentType,
  SavedAddress,
} from '@sweets/types';
import {
  AddressFields,
  addressLines,
  emptyAddress,
  toAddressInput,
} from '@/components/account/address-fields';
import { BillDetails } from '@/components/cart/cart-parts';
import { ProductImage } from '@/components/product/product-image';
import {
  CardIcon,
  CashIcon,
  CheckIcon,
  GiftIcon,
  ChevronRight,
  LockIcon,
  StoreIcon,
  TruckIcon,
} from '@/components/ui/icons';
import { browserApi } from '@/lib/browser-api';
import { useCart } from '@/lib/cart';
import { rememberGuestOrder } from '@/lib/guest-orders';
import { usePincode } from '@/lib/pincode';
import { deliveryFeeFor } from '@/lib/pricing';
import { useSession } from '@/lib/session';
import { site } from '@/lib/site';

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, count, subtotal, savings, clear, loaded } = useCart();
  const { user, ready, api } = useSession();
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('DELIVERY');
  const [address, setAddress] = useState<AddressInput>(emptyAddress);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<SavedAddress[] | null>(null);
  /** A saved address id, or 'new' to type one in. */
  const [selected, setSelected] = useState<string>('new');
  const [saveNew, setSaveNew] = useState(true);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [slots, setSlots] = useState<DeliverySlot[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponNote, setCouponNote] = useState<string | null>(null);
  const [gift, setGift] = useState({ isGift: false, message: '', wrap: true });
  const { current: pin, check: checkPincode } = usePincode();
  const [pinStatus, setPinStatus] = useState<{ pincode: string; serviceable: boolean } | null>(
    null,
  );

  useEffect(() => {
    browserApi.delivery
      .slots()
      .then((list) => {
        setSlots(list);
        setSlot((cur) => cur ?? list.find((s) => s.available)?.start ?? null);
      })
      .catch(() => setSlots([]));
  }, []);

  // Returning customers pick from their saved addresses; the default is preselected.
  useEffect(() => {
    if (!user) return;
    api.account
      .addresses()
      .then((list) => {
        setSaved(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setSelected(def.id);
      })
      .catch(() => setSaved([]));
  }, [user, api]);

  // Re-check an applied coupon whenever the cart changes (minimum order, caps…).
  const cartKey = lines.map((l) => `${l.variantId}:${l.quantity}`).join(',');
  const appliedCode = coupon?.code;
  useEffect(() => {
    if (!appliedCode || !cartKey) return;
    browserApi.coupons
      .check({
        code: appliedCode,
        items: cartKey.split(',').map((x) => {
          const [variantId, q] = x.split(':');
          return { variantId: variantId!, quantity: Number(q) };
        }),
        fulfillment,
        email: user ? undefined : contact.email || undefined,
      })
      .then(setCoupon)
      .catch((e) => {
        setCoupon(null);
        setCouponNote(e instanceof ApiError ? e.message : null);
      });
    // contact.email is read only when re-checking; typing shouldn't trigger requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCode, cartKey, fulfillment, user]);

  // Guests start from the pincode they checked in the header.
  useEffect(() => {
    if (ready && !user && pin?.pincode)
      setAddress((a) => (a.pincode ? a : { ...a, pincode: pin.pincode }));
  }, [ready, user, pin?.pincode]);

  const savedAddress = saved?.find((a) => a.id === selected);
  const chosenPincode = savedAddress ? savedAddress.pincode : address.pincode;

  // Tell the customer straight away if we can't deliver to the address's pincode.
  useEffect(() => {
    if (fulfillment !== 'DELIVERY' || !/^\d{6}$/.test(chosenPincode)) {
      setPinStatus(null);
      return;
    }
    let live = true;
    checkPincode(chosenPincode)
      .then((r) => live && setPinStatus(r))
      .catch(() => live && setPinStatus(null));
    return () => {
      live = false;
    };
  }, [fulfillment, chosenPincode, checkPincode]);

  useEffect(() => {
    if (user)
      setAddress((a) => ({
        ...a,
        name: a.name || user.name,
        phone: a.phone || (user.phone ?? ''),
      }));
  }, [user]);

  if (!ready || !loaded) return <div className="min-h-[60vh]" />;
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

  const couponOff = Number(coupon?.discount ?? 0);
  const total =
    subtotal - couponOff + (coupon?.freeDelivery ? 0 : deliveryFeeFor(subtotal, fulfillment));
  const needsSlot = fulfillment === 'DELIVERY' && !!slots?.length;
  const chosenSlot = slots?.find((s) => s.start === slot && s.available);
  const unserviceable = fulfillment === 'DELIVERY' && pinStatus?.serviceable === false;
  const blocked = unserviceable || (needsSlot && !chosenSlot);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (needsSlot && !chosenSlot) {
      setSubmitting(false);
      return setError('Please pick a delivery time.');
    }
    try {
      const chosen = savedAddress ? toAddressInput(savedAddress) : address;
      const isDelivery = fulfillment === 'DELIVERY';
      const order = {
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        fulfillment,
        address: isDelivery
          ? {
              ...chosen,
              name: chosen.name || contact.name,
              phone: chosen.phone || contact.phone,
              line2: chosen.line2 || undefined,
            }
          : undefined,
        deliverySlotStart: isDelivery && chosenSlot ? new Date(chosenSlot.start) : undefined,
        deliverySlotEnd: isDelivery && chosenSlot ? new Date(chosenSlot.end) : undefined,
        saveAddress: !!user && isDelivery && !savedAddress && saveNew,
        couponCode: coupon?.code,
        isGift: gift.isGift || undefined,
        giftMessage: gift.isGift ? gift.message.trim() || undefined : undefined,
        giftWrap: gift.isGift ? gift.wrap : undefined,
        paymentProvider: 'COD' as const,
        channel: 'WEB' as const,
      };
      if (user) {
        const placed = await api.orders.place(order);
        clear();
        router.push(`/account/orders/${placed.order.orderNumber}?placed=1`);
      } else {
        const placed = await browserApi.orders.placeGuest({ order, contact });
        rememberGuestOrder(placed.order.orderNumber, placed.token);
        clear();
        router.push(
          `/orders/track/${placed.order.orderNumber}?t=${encodeURIComponent(placed.token)}&placed=1`,
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong, please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = submitting ? 'Placing order…' : `Place order · ${formatMoney(total)}`;

  return (
    <form id="checkout" onSubmit={placeOrder} className="container-page pb-36 pt-8 lg:pb-16">
      <p className="eyebrow">Step 2 of 2</p>
      <h1 className="mt-2 text-4xl font-light sm:text-5xl">Checkout</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-5">
          {!user && (
            <Step n={0} title="Your details">
              <p className="-mt-2 mb-4 text-sm text-cocoa-soft">
                No account needed.{' '}
                <Link href="/login?next=/checkout" className="font-bold text-brand-600">
                  Sign in
                </Link>{' '}
                for saved addresses and order history.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">Full name</span>
                  <input
                    required
                    autoComplete="name"
                    maxLength={100}
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    className="input-field"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">Mobile</span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="(\+91 ?)?[6-9]\d{4} ?\d{5}"
                    title="10-digit Indian mobile number"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    className="input-field"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">
                    Email <span className="font-normal">(for your receipt)</span>
                  </span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    className="input-field"
                  />
                </label>
              </div>
            </Step>
          )}
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
              <div className="space-y-3">
                {user && saved === null && (
                  <div className="h-20 animate-pulse rounded-2xl bg-brand-100" aria-hidden />
                )}
                {!!saved?.length && (
                  <div className="grid gap-2.5" role="radiogroup" aria-label="Saved addresses">
                    {saved.map((a) => {
                      const on = selected === a.id;
                      return (
                        <button
                          type="button"
                          key={a.id}
                          role="radio"
                          aria-checked={on}
                          onClick={() => setSelected(a.id)}
                          className={`relative flex gap-3 rounded-2xl border bg-white p-4 text-left text-sm transition ${on ? 'border-cocoa ring-1 ring-cocoa' : 'border-brand-200 hover:border-cocoa/40'}`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-300'}`}
                          >
                            {on && <CheckIcon size={11} strokeWidth={3} />}
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2 font-bold">
                              {a.label ?? a.name}
                              {a.isDefault && (
                                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs uppercase tracking-wider text-cocoa-soft">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="block text-cocoa-soft">
                              {a.label ? `${a.name} · ` : ''}
                              {a.phone}
                            </span>
                            <span className="block text-cocoa-soft">{addressLines(a)}</span>
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected === 'new'}
                      onClick={() => setSelected('new')}
                      className={`flex items-center gap-3 rounded-2xl border border-dashed p-4 text-left text-sm font-bold transition ${selected === 'new' ? 'border-cocoa bg-white ring-1 ring-cocoa' : 'border-brand-300 text-brand-600 hover:border-cocoa/40'}`}
                    >
                      + Deliver to a new address
                    </button>
                  </div>
                )}
                {(!user || saved !== null) && selected === 'new' && (
                  <div className={saved?.length ? 'pt-2' : ''}>
                    <AddressFields value={address} onChange={setAddress} withContact={!!user} />
                    {user && (
                      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={saveNew}
                          onChange={(e) => setSaveNew(e.target.checked)}
                          className="h-4 w-4 accent-brand-600"
                        />
                        Save this address for next time
                      </label>
                    )}
                  </div>
                )}
                {!!saved?.length && (
                  <Link
                    href="/account/addresses"
                    className="inline-block text-xs font-bold text-brand-600 hover:underline"
                  >
                    Manage addresses
                  </Link>
                )}
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

          {needsSlot && slots && (
            <Step n={3} title="Delivery time">
              <SlotPicker slots={slots} value={slot} onChange={setSlot} />
            </Step>
          )}

          <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
            <label className="flex cursor-pointer items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-100 text-saffron-600">
                <GiftIcon size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-bold">Send as a gift</span>
                <span className="text-xs text-cocoa-soft">
                  Add a card message. Prices are left off the packing slip.
                </span>
              </span>
              <input
                type="checkbox"
                checked={gift.isGift}
                onChange={(e) => setGift((g) => ({ ...g, isGift: e.target.checked }))}
                className="h-5 w-5 accent-brand-600"
              />
            </label>
            {gift.isGift && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1.5 flex justify-between text-xs font-bold text-cocoa-soft">
                    Message for the card
                    <span className="font-normal">{gift.message.length}/300</span>
                  </span>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={gift.message}
                    onChange={(e) => setGift((g) => ({ ...g, message: e.target.value }))}
                    placeholder="Happy Diwali! With love, Ananya"
                    className="input-field"
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={gift.wrap}
                    onChange={(e) => setGift((g) => ({ ...g, wrap: e.target.checked }))}
                    className="h-4 w-4 accent-brand-600"
                  />
                  Festive gift wrap <span className="font-semibold text-pista-600">(free)</span>
                </label>
                {fulfillment === 'DELIVERY' && (
                  <p className="text-xs text-cocoa-soft">
                    Tip: put the recipient’s name and phone in the delivery address.
                  </p>
                )}
              </div>
            )}
          </section>

          <Step n={needsSlot ? 4 : 3} title="Payment">
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
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cocoa px-1 text-xs font-bold text-white">
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
            <CouponField
              applied={coupon}
              note={couponNote}
              onApply={async (code) => {
                setCouponNote(null);
                try {
                  setCoupon(
                    await browserApi.coupons.check({
                      code,
                      items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
                      fulfillment,
                      email: user ? undefined : contact.email || undefined,
                    }),
                  );
                } catch (e) {
                  setCouponNote(e instanceof ApiError ? e.message : 'Couldn’t check that code.');
                }
              }}
              onRemove={() => {
                setCoupon(null);
                setCouponNote(null);
              }}
            />
          </div>
          <div className="border-t border-brand-100 pt-4">
            <BillDetails
              subtotal={subtotal}
              savings={savings}
              fulfillment={fulfillment}
              coupon={coupon}
            />
          </div>
          {unserviceable && (
            <p
              className="rounded-xl bg-saffron-100 px-3 py-2.5 text-sm font-medium text-cocoa"
              role="alert"
            >
              We don’t deliver to {pinStatus?.pincode} yet. Choose store pickup, or another address.
            </p>
          )}
          {error && (
            <p
              className="rounded-xl bg-brand-100 px-3 py-2.5 text-sm font-medium text-brand-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            disabled={submitting || blocked}
            className="btn-primary hidden w-full py-4 lg:flex"
          >
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
          disabled={submitting || blocked}
          className="flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white disabled:opacity-60"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="font-extrabold tabular-nums">{formatMoney(total)}</span>
            <span className="text-xs font-semibold opacity-75">
              {unserviceable
                ? 'We don’t deliver to this pincode'
                : needsSlot && !chosenSlot
                  ? 'Pick a delivery time'
                  : `${count} item${count > 1 ? 's' : ''} · cash on delivery`}
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
          {n || '★'}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Slots grouped by day ("Today", "Tomorrow", …); full slots are shown but disabled. */
function SlotPicker({
  slots,
  value,
  onChange,
}: {
  slots: DeliverySlot[];
  value: string | null;
  onChange: (start: string) => void;
}) {
  const days = [...new Set(slots.map((s) => s.date))];
  const [day, setDay] = useState(() => slots.find((s) => s.start === value)?.date ?? days[0] ?? '');
  const dayName = (d: string) => slots.find((s) => s.date === d)!.label.split(',')[0];
  return (
    <div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist">
        {days.map((d) => (
          <button
            type="button"
            key={d}
            role="tab"
            aria-selected={day === d}
            onClick={() => setDay(d)}
            className={`chip ${day === d ? 'chip-active' : ''}`}
          >
            {dayName(d)}
          </button>
        ))}
      </div>
      <div
        className="mt-3 grid gap-2.5 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Delivery time"
      >
        {slots
          .filter((s) => s.date === day)
          .map((s) => {
            const on = value === s.start;
            return (
              <button
                type="button"
                key={s.start}
                role="radio"
                aria-checked={on}
                disabled={!s.available}
                onClick={() => onChange(s.start)}
                className={`rounded-2xl border p-3.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'border-cocoa bg-white ring-1 ring-cocoa' : 'border-brand-200 bg-white hover:border-cocoa/40'}`}
              >
                <span className="block font-bold">{s.label.split(', ').slice(1).join(', ')}</span>
                <span className="text-xs text-cocoa-soft">
                  {s.available ? 'Available' : 'Full'}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function CouponField({
  applied,
  note,
  onApply,
  onRemove,
}: {
  applied: CouponPreview | null;
  note: string | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-pista-50 px-4 py-3 text-sm ring-1 ring-pista-100">
        <span>
          <span className="font-bold text-pista-700">{applied.code} applied</span>
          <span className="block text-xs text-cocoa-soft">
            {applied.freeDelivery
              ? 'Free delivery on this order'
              : `You save ${formatMoney(applied.discount)}`}
            {applied.description ? ` · ${applied.description}` : ''}
          </span>
        </span>
        <button type="button" onClick={onRemove} className="text-xs font-bold text-brand-600">
          Remove
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Coupon code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (
                  e.currentTarget.closest('div')?.querySelector('button') as HTMLButtonElement
                )?.click();
              }
            }}
            maxLength={20}
            placeholder="Coupon code"
            className="input-field uppercase tracking-wider"
          />
        </label>
        <button
          type="button"
          disabled={!code || busy}
          onClick={async () => {
            setBusy(true);
            await onApply(code);
            setBusy(false);
          }}
          className="btn-ghost rounded-xl px-4"
        >
          {busy ? '…' : 'Apply'}
        </button>
      </div>
      {note && <p className="mt-2 text-xs font-semibold text-brand-600">{note}</p>}
    </div>
  );
}
