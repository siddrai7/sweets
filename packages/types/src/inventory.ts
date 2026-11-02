import { z } from 'zod';
import { dateTimeSchema, moneySchema } from './common.js';

export const locationInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['KITCHEN', 'STORE', 'WAREHOUSE']),
  address: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});
export type LocationInput = z.infer<typeof locationInputSchema>;

/** Record freshly produced or purchased finished goods as a new batch. */
export const addStockBatchSchema = z.object({
  variantId: z.string(),
  locationId: z.string(),
  quantity: z.number().int().positive(),
  source: z.enum(['PRODUCTION', 'PURCHASE']).default('PRODUCTION'),
  producedAt: dateTimeSchema.optional(),
  /** Defaults to producedAt + product.shelfLifeDays when omitted. */
  expiresAt: dateTimeSchema.optional(),
  unitCost: moneySchema.optional(),
  batchCode: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
});
export type AddStockBatchInput = z.infer<typeof addStockBatchSchema>;

/** Remove units from a specific batch (wastage, breakage, expiry, count correction). */
export const adjustStockSchema = z.object({
  batchId: z.string(),
  /** Signed: negative removes stock, positive adds it back. */
  quantityDelta: z
    .number()
    .int()
    .refine((n) => n !== 0, 'Must not be zero'),
  type: z.enum(['ADJUSTMENT', 'WASTAGE']),
  note: z.string().max(500).optional(),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const expiringQuerySchema = z.object({
  withinHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .default(48),
});
