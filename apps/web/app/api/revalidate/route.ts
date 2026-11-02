import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CATALOG_TAG } from '@/lib/api';

/**
 * Called by the API after products or categories change, so the shop never shows archived
 * products, old prices or renamed pages. Authenticated with a shared secret.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: 'Revalidation is not configured' }, { status: 503 });
  }
  const given = Buffer.from(request.headers.get('x-revalidate-secret') ?? '');
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // `expire: 0`: never serve the stale copy, so archived products disappear immediately.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return Response.json({ revalidated: true, now: Date.now() });
}
