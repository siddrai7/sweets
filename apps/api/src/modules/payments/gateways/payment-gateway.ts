import type { PaymentProvider } from '@sweets/types';

export interface PaymentIntentResult {
  /** Gateway-side id (e.g. Razorpay order id) used to reconcile webhooks. */
  providerRef: string | null;
  /** Whatever the client needs to open the gateway's checkout. Null for COD. */
  clientPayload: Record<string, unknown> | null;
  /** True when the order is good to go without waiting for a webhook (COD). */
  confirmImmediately: boolean;
}

/**
 * One implementation per provider. Add Razorpay / Stripe by implementing this and
 * registering it in PaymentsModule — orders code does not change.
 */
export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createIntent(args: {
    orderId: string;
    orderNumber: string;
    amount: string;
    currency: string;
  }): Promise<PaymentIntentResult>;
}

export const PAYMENT_GATEWAYS = Symbol('PAYMENT_GATEWAYS');
