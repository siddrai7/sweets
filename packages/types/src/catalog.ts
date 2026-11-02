import { z } from 'zod';
import { moneySchema, paginationQuerySchema, slugSchema } from './common.js';

// Base shapes carry no defaults so `.partial()` update schemas never reset omitted fields.
const categoryBaseSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
  imageUrl: z.url().optional(),
  parentId: z.string().optional(),
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

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1).max(64),
  /** Human label shown to customers, e.g. "500 g" or "Box of 12". */
  label: z.string().min(1).max(50),
  weightGrams: z.number().int().positive().optional(),
  price: moneySchema,
  mrp: moneySchema.optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

const productBaseSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(5000).optional(),
  categoryId: z.string(),
  images: z.array(z.url()),
  tags: z.array(z.string()),
  isVeg: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  shelfLifeDays: z.number().int().positive().optional(),
  hsnCode: z.string().max(10).optional(),
  taxRatePercent: moneySchema,
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  ingredients: z.string().max(1000).optional(),
  allergens: z.string().max(500).optional(),
  storageInstructions: z.string().max(500).optional(),
  variants: z.array(variantInputSchema).min(1),
});

export const productInputSchema = productBaseSchema.extend({
  images: z.array(z.url()).default([]),
  tags: z.array(z.string()).default([]),
  isVeg: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  taxRatePercent: moneySchema.default('5'),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productUpdateSchema = productBaseSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const PRODUCT_SORTS = [
  'featured',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'newest',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

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
});
export type ProductQuery = z.infer<typeof productQuerySchema>;
