import { z } from 'zod';
import { indianPincodeSchema } from './common.js';
import { placeOrderSchema } from './orders.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM');

export const serviceAreaInputSchema = z.object({
  pincode: indianPincodeSchema,
  label: z.string().trim().min(1).max(60),
  isActive: z.boolean().default(true),
});
export type ServiceAreaInput = z.infer<typeof serviceAreaInputSchema>;

/** Add many pincodes at once, e.g. "400601, 400602" with one area label. */
export const bulkServiceAreaSchema = z.object({
  pincodes: z.array(indianPincodeSchema).min(1).max(500),
  label: z.string().trim().min(1).max(60),
});
export type BulkServiceAreaInput = z.infer<typeof bulkServiceAreaSchema>;

export const deliverySlotDefSchema = z
  .object({
    start: time,
    end: time,
    /** Most orders per slot per day; empty means no limit. */
    capacity: z.number().int().min(1).max(1000).nullable().optional(),
  })
  .refine((s) => s.end > s.start, { message: 'A slot must end after it starts', path: ['end'] });

/** How and when the shop delivers. Edited in the ERP; enforced by the API. */
export const deliverySettingsSchema = z.object({
  /** Delivery time slots offered each day. Empty: no slots, deliver as soon as possible. */
  slots: z.array(deliverySlotDefSchema).max(12),
  /** Minimum minutes between ordering and the start of a slot (time to prepare). */
  leadMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
  /** How many days ahead customers can choose (1 = today only). */
  daysAhead: z.number().int().min(1).max(14),
  /** Orders after this time (24h HH:MM) can't get a same-day slot. */
  sameDayCutoff: time,
  /** Dates the shop doesn't deliver, YYYY-MM-DD. */
  closedDates: z.array(z.iso.date()).max(60),
});
export type DeliverySettings = z.infer<typeof deliverySettingsSchema>;

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  slots: [
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '15:00', end: '17:00' },
    { start: '17:00', end: '19:00' },
    { start: '19:00', end: '21:00' },
  ],
  leadMinutes: 90,
  daysAhead: 4,
  sameDayCutoff: '17:30',
  closedDates: [],
};

/** Guest checkout: contact details instead of an account. */
export const guestOrderSchema = z.object({
  order: placeOrderSchema,
  contact: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.email(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{8,15}$/, 'Enter a valid mobile number'),
  }),
});
export type GuestOrderInput = z.infer<typeof guestOrderSchema>;
