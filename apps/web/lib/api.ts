import { createApiClient } from '@sweets/api-client';

/**
 * Server-side client for public catalog reads (no auth). Server components use API_URL,
 * which can point at an internal address in production.
 */
export const serverApi = createApiClient({
  baseUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
});

/** Catalog pages are statically rendered and refreshed in the background every minute. */
export const CATALOG_REVALIDATE = { next: { revalidate: 60 } } as const;

/** Never let an API outage break a build or a page render; show an empty state instead. */
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error('[api]', error instanceof Error ? error.message : error);
    return fallback;
  }
}
