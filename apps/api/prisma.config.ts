import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read directly (not via `env()`) so `prisma generate` works in CI without a database URL.
    // Migrations need a direct connection, so DIRECT_URL (if set) skips a pooler like Neon's.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
