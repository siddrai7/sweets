import { z } from 'zod';
import { dateTimeSchema, moneySchema } from './common.js';
import { MEASUREMENT_UNITS } from './enums.js';

/** Indian GSTIN: 2-digit state code, PAN, entity number, "Z", checksum. */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Base shape carries no defaults so the `.partial()` update schema never resets omitted fields.
// Optional fields are `.nullable()` so an edit can clear them.
const vendorBaseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  contactName: z.string().trim().max(100).nullable().optional(),
  email: z.email().nullable().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,15}$/, 'Enter a valid phone number')
    .nullable()
    .optional(),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_PATTERN, 'GSTIN should look like 27ABCDE1234F1Z5')
    .nullable()
    .optional(),
  address: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean(),
});

export const vendorInputSchema = vendorBaseSchema.extend({ isActive: z.boolean().default(true) });
export type VendorInput = z.infer<typeof vendorInputSchema>;

export const vendorUpdateSchema = vendorBaseSchema.partial();
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
