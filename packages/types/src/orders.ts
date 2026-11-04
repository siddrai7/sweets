import { z } from 'zod';
import { dateTimeSchema, indianPincodeSchema, paginationQuerySchema } from './common.js';
import { FULFILLMENT_TYPES, ORDER_CHANNELS, ORDER_STATUSES } from './enums.js';

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
