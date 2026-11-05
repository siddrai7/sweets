import type { Order } from '@sweets/types';
import { site } from './site';

const time = (d: Date) =>
  d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

/**
 * Customer-facing estimate for when an order arrives or is ready, from the placeholder
 * delivery promises in `site.delivery`. Returns null once the order is finished.
 */
export function deliveryEstimate(
  order: Pick<Order, 'status' | 'fulfillment' | 'createdAt'> &
    Partial<Pick<Order, 'deliverySlotStart' | 'deliverySlotEnd'>>,
) {
  if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return null;
  if (order.fulfillment === 'DELIVERY' && order.deliverySlotStart && order.deliverySlotEnd) {
    const start = new Date(order.deliverySlotStart);
    const ist = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const now = new Date();
    const dayOffset = Math.round((Date.parse(ist(start)) - Date.parse(ist(now))) / 86_400_000);
    const dayName = start.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    });
    const t = (d: Date) =>
      d
        .toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
        .toLowerCase();
    const day = dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : dayName;
    return `Arriving ${day}, ${t(start)} – ${t(new Date(order.deliverySlotEnd))}`;
  }
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
