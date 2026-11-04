import {
  ORDER_STATUS_TRANSITIONS,
  type FulfillmentType,
  type OrderStatus,
  type RefundMethod,
  type ReturnReason,
} from '@sweets/types';

export const STATUS_TONE: Record<OrderStatus, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  PENDING_PAYMENT: 'amber',
  CONFIRMED: 'blue',
  PREPARING: 'blue',
  READY: 'blue',
  OUT_FOR_DELIVERY: 'blue',
  DELIVERED: 'green',
  CANCELLED: 'red',
  REFUNDED: 'slate',
};

export const statusLabel = (s: string) =>
  s.charAt(0) + s.slice(1).replaceAll('_', ' ').toLowerCase();

/** Next steps staff can take. Refunds are recorded on the order, not set as a status. */
export function nextActions(status: OrderStatus, fulfillment: FulfillmentType) {
  return ORDER_STATUS_TRANSITIONS[status]
    .filter((to) => to !== 'REFUNDED')
    .filter((to) => !(fulfillment === 'PICKUP' && to === 'OUT_FOR_DELIVERY'))
    .map((to) => ({
      to,
      label: {
        PENDING_PAYMENT: 'Awaiting payment',
        CONFIRMED: 'Confirm',
        PREPARING: 'Start preparing',
        READY: fulfillment === 'PICKUP' ? 'Ready for pickup' : 'Mark packed',
        OUT_FOR_DELIVERY: 'Out for delivery',
        DELIVERED: fulfillment === 'PICKUP' ? 'Mark collected' : 'Mark delivered',
        CANCELLED: 'Cancel',
        REFUNDED: 'Refunded',
      }[to],
    }));
}

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
  DAMAGED: 'Damaged',
  WRONG_ITEM: 'Wrong item',
  MISSING_ITEM: 'Missing item',
  QUALITY: 'Quality issue',
  OTHER: 'Other',
};

export const REFUND_METHOD_LABEL: Record<RefundMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank transfer',
  ORIGINAL_PAYMENT: 'Original payment method',
};

/**
 * Opens an authenticated HTML document (e.g. the invoice) in a new tab. The tab is opened
 * synchronously so pop-up blockers allow it, then filled once the document arrives.
 */
export async function openDocument(load: () => Promise<string>) {
  const tab = window.open('', '_blank');
  try {
    const html = await load();
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    tab?.close();
    alert(e instanceof Error ? e.message : 'Couldn’t open the document');
  }
}
