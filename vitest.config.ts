import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Unit tests across the monorepo: `pnpm test`. */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./apps/web', import.meta.url)) },
  },
  test: {
    include: [
      'apps/api/src/**/*.test.ts',
      'apps/web/lib/**/*.test.ts',
      'packages/*/src/**/*.test.ts',
    ],
  },
});
