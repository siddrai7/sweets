'use client';

import { useEffect } from 'react';
import { browserApi } from '@/lib/browser-api';

/**
 * Records a search for the ERP's search report. Done from the browser because the results
 * page itself is served from cache, so the server can't count repeat searches.
 */
export function SearchLogger({ q }: { q: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      void browserApi.catalog.products({ search: q, log: true, pageSize: 1 }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [q]);
  return null;
}
