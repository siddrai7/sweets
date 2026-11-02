import { z } from 'zod';
import { dateTimeSchema, indianPincodeSchema, paginationQuerySchema } from './common.js';
import { FULFILLMENT_TYPES, ORDER_CHANNELS, ORDER_STATUSES } from './enums.js';

export const addressSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(8).max(15),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
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
