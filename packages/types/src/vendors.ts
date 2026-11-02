import { z } from 'zod';
import { dateTimeSchema, moneySchema } from './common.js';
import { MEASUREMENT_UNITS } from './enums.js';

export const vendorInputSchema = z.object({
  name: z.string().min(1).max(150),
  contactName: z.string().max(100).optional(),
  email: z.email().optional(),
  phone: z.string().max(15).optional(),
  gstin: z.string().max(15).optional(),
  address: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});
export type VendorInput = z.infer<typeof vendorInputSchema>;

export const vendorUpdateSchema = vendorInputSchema.extend({ isActive: z.boolean() }).partial();
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;

export const rawMaterialInputSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.enum(MEASUREMENT_UNITS),
  reorderLevel: moneySchema.default('0'),
});
export type RawMaterialInput = z.infer<typeof rawMaterialInputSchema>;

export const purchaseOrderInputSchema = z.object({
  vendorId: z.string(),
  expectedAt: dateTimeSchema.optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        rawMaterialId: z.string().optional(),
        description: z.string().min(1).max(200),
        quantity: moneySchema,
        unit: z.enum(MEASUREMENT_UNITS),
        unitPrice: moneySchema,
      }),
    )
    .min(1),
});
export type PurchaseOrderInput = z.infer<typeof purchaseOrderInputSchema>;
