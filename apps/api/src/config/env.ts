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
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
