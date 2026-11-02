import { createApiClient, type FetchInit } from '@sweets/api-client';

/**
 * Server-side client for public catalog reads (no auth). Server components use API_URL,
 * which can point at an internal address in production.
 */
export const serverApi = createApiClient({
  baseUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
});

/** Cache tag on every catalog read; the API calls /api/revalidate to expire it after edits. */
export const CATALOG_TAG = 'catalog';

/**
 * Catalog pages are statically rendered. They refresh the moment the ERP changes the catalog
 * (the API pings /api/revalidate), with a one-minute background refresh as a fallback.
 */
export const CATALOG_REVALIDATE: FetchInit = { next: { revalidate: 60, tags: [CATALOG_TAG] } };

/** Never let an API outage break a build or a page render; show an empty state instead. */
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error('[api]', error instanceof Error ? error.message : error);
    return fallback;
  }
}
