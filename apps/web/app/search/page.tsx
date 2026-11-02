import type { Metadata } from 'next';
import { ShopView, type ShopSearchParams } from '@/components/shop/shop-view';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const categories = await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []);
  const q = params.q?.trim();
  return (
    <ShopView
      title={q ? `Results for “${q}”` : 'Search'}
      categories={categories}
      searchParams={params}
      crumbs={[{ label: 'Search', href: '/search' }]}
    />
  );
}
