import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Money travels as a decimal string ("249.00") to avoid float rounding. */
export const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    'Must be a non-negative amount with up to 2 decimals',
  );

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only');

export const indianPincodeSchema = z.string().regex(/^\d{6}$/, 'Must be a 6-digit pincode');

/** ISO date or datetime string on the wire, `Date` after parsing (keeps the schema JSON-Schema friendly). */
export const dateTimeSchema = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .transform((s) => new Date(s));
