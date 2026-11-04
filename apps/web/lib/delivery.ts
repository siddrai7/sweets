import type { Order } from '@sweets/types';
import { site } from './site';

const time = (d: Date) =>
  d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

/**
 * Customer-facing estimate for when an order arrives or is ready, from the placeholder
 * delivery promises in `site.delivery`. Returns null once the order is finished.
 */
export function deliveryEstimate(order: Pick<Order, 'status' | 'fulfillment' | 'createdAt'>) {
  if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return null;
  const placed = new Date(order.createdAt);
  const after = (mins: number) => new Date(placed.getTime() + mins * 60_000);

  if (order.fulfillment === 'PICKUP') {
    return order.status === 'READY'
      ? 'Ready for pickup now'
      : `Ready for pickup by ${time(after(site.delivery.pickupReadyMinutes))}`;
  }
  if (placed.getHours() >= site.delivery.sameDayCutoffHour) {
    return 'Arriving tomorrow morning';
  }
  const { min, max } = site.delivery.etaMinutes;
  return `Arriving today, ${time(after(min))} – ${time(after(max))}`;
}
