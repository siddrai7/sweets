import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  CURRENCY: z.string().length(3).default('INR'),
  DELIVERY_FEE: z.coerce.number().min(0).default(49),
  FREE_DELIVERY_ABOVE: z.coerce.number().min(0).default(999),
  /**
   * Storefront endpoint to call after catalog edits (e.g. https://shop.example.com/api/revalidate)
   * so changes show immediately. Without it the shop catches up within a minute, except that
   * archived products can linger until the next deploy.
   */
  STOREFRONT_REVALIDATE_URL: z.url().optional(),
  /** Shared with the storefront's REVALIDATE_SECRET. */
  REVALIDATE_SECRET: z.string().min(16).optional(),

  // Seller details printed on GST tax invoices. PLACEHOLDERS: replace with the client's
  // registered details before issuing real invoices.
  SELLER_LEGAL_NAME: z.string().min(1).default('Mithai House Foods Pvt. Ltd. (placeholder)'),
  SELLER_TRADE_NAME: z.string().min(1).default('Mithai House'),
  SELLER_GSTIN: z.string().length(15).default('27AAAAA0000A1Z5'),
  SELLER_ADDRESS: z
    .string()
    .min(1)
    .default('Shop No. 1, Main Road, Thane West, Maharashtra 400601'),
  /** State for CGST+SGST vs IGST, and its 2-digit GST state code. */
  SELLER_STATE: z.string().min(1).default('Maharashtra'),
  SELLER_STATE_CODE: z.string().length(2).default('27'),
  SELLER_FSSAI: z.string().default('XXXXXXXXXXXXXX'),
  SELLER_PHONE: z.string().default('+91 98765 43210'),
  SELLER_EMAIL: z.string().default('hello@example.com'),
  /** Invoice numbers look like "<prefix>/26-27/00042" (max 16 characters for GST). */
  INVOICE_PREFIX: z
    .string()
    .regex(/^[A-Z0-9]{1,5}$/)
    .default('MH'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
