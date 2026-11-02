/**
 * Enum values shared by every client. These must stay in sync with the enums in
 * apps/api/prisma/schema.prisma — the API maps Prisma enums 1:1 onto these.
 */

export const ROLES = ['ADMIN', 'STAFF', 'VENDOR', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

/** Roles that may sign in to the ERP. */
export const ERP_ROLES: readonly Role[] = ['ADMIN', 'STAFF', 'VENDOR'];

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed order status transitions. Enforced by the API, used by the ERP to render actions. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const FULFILLMENT_TYPES = ['DELIVERY', 'PICKUP'] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export const ORDER_CHANNELS = ['WEB', 'APP', 'POS', 'ERP'] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const PAYMENT_PROVIDERS = ['COD', 'RAZORPAY', 'STRIPE', 'MANUAL'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const LOCATION_TYPES = ['KITCHEN', 'STORE', 'WAREHOUSE'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'PRODUCTION',
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'WASTAGE',
  'TRANSFER',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const MEASUREMENT_UNITS = ['KG', 'G', 'L', 'ML', 'PCS'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'SENT',
  'ACKNOWLEDGED',
  'RECEIVED',
  'CANCELLED',
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
