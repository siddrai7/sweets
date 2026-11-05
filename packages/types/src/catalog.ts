import { z } from 'zod';
import { PRODUCT_SORTS } from './constants.js';
import { moneySchema, paginationQuerySchema, slugSchema } from './common.js';

// Base shapes carry no defaults so `.partial()` update schemas never reset omitted fields.
// Optional text fields are `.nullable()` so an edit can clear them (send null).
const categoryBaseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  /** Parent category; null makes it a top-level category. Only two levels are supported. */
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export const categoryInputSchema = categoryBaseSchema.extend({
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categoryUpdateSchema = categoryBaseSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export const variantInputSchema = z
  .object({
    id: z.string().optional(),
    sku: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9-_]+$/, 'SKU can use letters, numbers, - and _ only'),
    /** Human label shown to customers, e.g. "500 g" or "Box of 12". */
    label: z.string().trim().min(1).max(50),
    weightGrams: z.number().int().positive().nullable().optional(),
    price: moneySchema,
    /** List price; when higher than `price` the shop shows a discount. */
    mrp: moneySchema.nullable().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    /** Low-stock alert level in the ERP. */
    lowStockThreshold: z.number().int().min(0).optional(),
  })
  .refine((v) => !v.mrp || Number(v.mrp) >= Number(v.price), {
    message: 'MRP can’t be lower than the selling price',
    path: ['mrp'],
  });
export type VariantInput = z.infer<typeof variantInputSchema>;

const productBaseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(5000).nullable().optional(),
  categoryId: z.string().min(1, 'Choose a category'),
  images: z.array(z.url()).max(10),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20),
  /** Other names customers search for ("laddu", "burfi"). */
  searchAliases: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20),
  isVeg: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  shelfLifeDays: z.number().int().positive().nullable().optional(),
  hsnCode: z.string().max(10).nullable().optional(),
  taxRatePercent: moneySchema,
  metaTitle: z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  ingredients: z.string().max(1000).nullable().optional(),
  allergens: z.string().max(500).nullable().optional(),
  storageInstructions: z.string().max(500).nullable().optional(),
  variants: z
    .array(variantInputSchema)
    .min(1, 'Add at least one pack size')
    .refine((vs) => new Set(vs.map((v) => v.sku.toLowerCase())).size === vs.length, {
      message: 'Each pack size needs its own SKU',
    }),
});

export const productInputSchema = productBaseSchema.extend({
  images: z.array(z.url()).default([]),
  tags: z.array(z.string()).default([]),
  searchAliases: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20).default([]),
  isVeg: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  taxRatePercent: moneySchema.default('5'),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productUpdateSchema = productBaseSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productQuerySchema = paginationQuerySchema.extend({
  /** Category slug; includes products in its sub-categories. */
  category: z.string().optional(),
  search: z.string().optional(),
  /** Curated collection tag, e.g. "bestseller", "classic". */
  tag: z.string().optional(),
  featured: z.stringbool().optional(),
  inStock: z.stringbool().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  /** Exclude one product (for "you may also like"). */
  exclude: z.string().optional(),
  sort: z.enum(PRODUCT_SORTS).default('featured'),
  includeInactive: z.stringbool().optional(),
  /** Record this search in the ERP's search report (set by the storefront search page). */
  log: z.stringbool().optional(),
  /** Staff only, with `includeInactive`: show only live (true) or only archived (false) products. */
  isActive: z.stringbool().optional(),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;
