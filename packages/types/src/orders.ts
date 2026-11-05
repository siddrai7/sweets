import { z } from 'zod';
import {
  dateTimeSchema,
  indianPincodeSchema,
  moneySchema,
  paginationQuerySchema,
} from './common.js';
import {
  FULFILLMENT_TYPES,
  ORDER_CHANNELS,
  ORDER_STATUSES,
  REFUND_METHODS,
  RETURN_REASONS,
  RETURN_STATUSES,
} from './enums.js';

export const addressSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,15}$/, 'Enter a valid mobile number'),
  line1: z.string().trim().min(1).max(200),
  /** Landmark or second line. */
  line2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: indianPincodeSchema,
});
export type AddressInput = z.infer<typeof addressSchema>;

export const placeOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          variantId: z.string(),
          quantity: z.number().int().min(1).max(100),
        }),
      )
      .min(1),
    fulfillment: z.enum(FULFILLMENT_TYPES).default('DELIVERY'),
    address: addressSchema.optional(),
    deliverySlotStart: dateTimeSchema.optional(),
    deliverySlotEnd: dateTimeSchema.optional(),
    paymentProvider: z.enum(['COD', 'RAZORPAY', 'STRIPE']).default('COD'),
    channel: z.enum(ORDER_CHANNELS).default('WEB'),
    notes: z.string().max(500).optional(),
    /** Also add the delivery address to the customer's saved addresses. */
    saveAddress: z.boolean().optional(),
  })
  .refine((o) => o.fulfillment === 'PICKUP' || !!o.address, {
    message: 'Address is required for delivery orders',
    path: ['address'],
  });
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().optional(),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;

const returnItemsSchema = z
  .array(z.object({ orderItemId: z.string().min(1), quantity: z.number().int().min(1) }))
  .min(1, 'Choose at least one item');

/** Customer: report a problem with a delivered order. */
export const returnRequestSchema = z.object({
  reason: z.enum(RETURN_REASONS),
  items: returnItemsSchema,
  note: z.string().trim().max(1000).optional(),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

/** Staff: approve a request and record how the money went back. */
export const approveReturnSchema = z.object({
  refundAmount: moneySchema.refine((v) => Number(v) > 0, 'Refund must be more than ₹0'),
  refundMethod: z.enum(REFUND_METHODS),
  note: z.string().trim().max(500).optional(),
});
export type ApproveReturnInput = z.infer<typeof approveReturnSchema>;

export const rejectReturnSchema = z.object({
  /** Shown to the customer. */
  note: z.string().trim().min(1, 'Tell the customer why').max(500),
});
export type RejectReturnInput = z.infer<typeof rejectReturnSchema>;

/** Staff: record a refund directly, e.g. after a phone call. Approved immediately. */
export const staffRefundSchema = approveReturnSchema.extend({
  reason: z.enum(RETURN_REASONS),
  items: returnItemsSchema.optional(),
});
export type StaffRefundInput = z.infer<typeof staffRefundSchema>;

export const returnQuerySchema = paginationQuerySchema.extend({
  status: z.enum(RETURN_STATUSES).optional(),
});
export type ReturnQuery = z.infer<typeof returnQuerySchema>;
