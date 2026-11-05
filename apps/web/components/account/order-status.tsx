import type { Order } from '@sweets/types';

export const ORDER_STATUS: Record<Order['status'], { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'bg-saffron-100 text-saffron-600' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-saffron-100 text-saffron-600' },
  PREPARING: { label: 'Being prepared', tone: 'bg-saffron-100 text-saffron-600' },
  READY: { label: 'Ready', tone: 'bg-pista-100 text-pista-600' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'bg-pista-100 text-pista-600' },
  DELIVERED: { label: 'Delivered', tone: 'bg-pista-100 text-pista-700' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-brand-100 text-brand-600' },
  REFUNDED: { label: 'Refunded', tone: 'bg-brand-100 text-cocoa-soft' },
};

/** Mirrors the API: customers can cancel until the kitchen starts preparing. */
export const CUSTOMER_CANCELLABLE: Order['status'][] = ['PENDING_PAYMENT', 'CONFIRMED'];

/** Order items don't carry a slug; the product name is enough to pick an illustration. */
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Progress bar for an active order. Pickup orders finish at "Ready" rather than delivery. */
export function OrderTracker({
  status,
  fulfillment,
  size = 'sm',
}: {
  status: Order['status'];
  fulfillment: Order['fulfillment'];
  size?: 'sm' | 'lg';
}) {
  const stages: { status: Order['status'][]; label: string }[] =
    fulfillment === 'PICKUP'
      ? [
          { status: ['PENDING_PAYMENT', 'CONFIRMED'], label: 'Confirmed' },
          { status: ['PREPARING'], label: 'Preparing' },
          { status: ['READY'], label: 'Ready to collect' },
          { status: ['DELIVERED', 'OUT_FOR_DELIVERY'], label: 'Collected' },
        ]
      : [
          { status: ['PENDING_PAYMENT', 'CONFIRMED'], label: 'Confirmed' },
          { status: ['PREPARING'], label: 'Preparing' },
          { status: ['READY', 'OUT_FOR_DELIVERY'], label: 'On the way' },
          { status: ['DELIVERED'], label: 'Delivered' },
        ];
  const current = stages.findIndex((s) => s.status.includes(status));
  if (current < 0) return null;
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Order progress">
      {stages.map((s, i) => (
        <li key={s.label} aria-current={i === current ? 'step' : undefined}>
          <span
            className={`block rounded-full ${size === 'lg' ? 'h-2' : 'h-1.5'} ${i <= current ? 'bg-pista-500' : 'bg-brand-100'}`}
          />
          <span
            className={`mt-1.5 block font-semibold ${size === 'lg' ? 'text-xs' : 'text-xs'} ${i <= current ? 'text-cocoa' : 'text-cocoa-soft/70'}`}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
