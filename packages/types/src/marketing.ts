import { z } from 'zod';
import { COUPON_TYPES, FULFILLMENT_TYPES, REVIEW_STATUSES } from './enums.js';
import { dateTimeSchema, moneySchema, paginationQuerySchema } from './common.js';

const couponCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,20}$/, '3–20 letters or numbers, no spaces');

/** Base shape without defaults, so the update schema's .partial() never resets fields. */
const couponBase = z.object({
  code: couponCode,
  description: z.string().trim().max(200).nullable(),
  type: z.enum(COUPON_TYPES),
  value: moneySchema,
  maxDiscount: moneySchema.nullable(),
  minSubtotal: moneySchema,
  startsAt: dateTimeSchema.nullable(),
  endsAt: dateTimeSchema.nullable(),
  usageLimit: z.number().int().min(1).nullable(),
  perCustomerLimit: z.number().int().min(1).nullable(),
  firstOrderOnly: z.boolean(),
  isActive: z.boolean(),
});

const couponRules = <T extends z.ZodType<Partial<z.infer<typeof couponBase>>>>(schema: T) =>
  schema
    .refine((c) => c.type !== 'PERCENT' || c.value === undefined || Number(c.value) <= 100, {
      message: 'A percentage can’t be more than 100',
      path: ['value'],
    })
    .refine((c) => !c.startsAt || !c.endsAt || c.endsAt > c.startsAt, {
      message: 'Must end after it starts',
      path: ['endsAt'],
    });

export const couponInputSchema = couponRules(
  couponBase.extend({
    description: couponBase.shape.description.default(null),
    value: moneySchema.default('0'),
    maxDiscount: couponBase.shape.maxDiscount.default(null),
    minSubtotal: moneySchema.default('0'),
    startsAt: couponBase.shape.startsAt.default(null),
    endsAt: couponBase.shape.endsAt.default(null),
    usageLimit: couponBase.shape.usageLimit.default(null),
    perCustomerLimit: couponBase.shape.perCustomerLimit.default(1),
    firstOrderOnly: z.boolean().default(false),
    isActive: z.boolean().default(true),
  }),
);
export type CouponInput = z.infer<typeof couponInputSchema>;

export const couponUpdateSchema = couponRules(couponBase.partial());
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

/** Preview a code against a cart at checkout. */
export const couponCheckSchema = z.object({
  code: couponCode,
  items: z
    .array(z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(100) }))
    .min(1),
  fulfillment: z.enum(FULFILLMENT_TYPES).default('DELIVERY'),
  /** Guests: lets first-order and per-customer limits apply before sign-up. */
  email: z.email().optional(),
});
export type CouponCheckInput = z.infer<typeof couponCheckSchema>;

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).nullable().optional(),
  body: z.string().trim().max(2000).nullable().optional(),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewModerationSchema = z.object({
  status: z.enum(REVIEW_STATUSES),
  moderationNote: z.string().trim().max(500).nullable().optional(),
});
export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;

export const reviewQuerySchema = paginationQuerySchema.extend({
  status: z.enum(REVIEW_STATUSES).optional(),
});
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

export const stockAlertSchema = z.object({ email: z.email() });
export type StockAlertInput = z.infer<typeof stockAlertSchema>;
