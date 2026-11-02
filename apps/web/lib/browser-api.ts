import { createApiClient } from '@sweets/api-client';

/** Unauthenticated client for public calls made from the browser (load more, forms). */
export const browserApi = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
});
