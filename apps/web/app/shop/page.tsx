import type { Metadata } from 'next';
import { ShopView, type ShopSearchParams } from '@/components/shop/shop-view';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Shop all sweets, namkeen & bakery',
  description:
    'Order fresh Indian sweets, dry fruit mithai, namkeen and bakery online. Handcrafted daily in pure ghee.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const categories = await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []);
  return (
    <ShopView
      title="All products"
      description="Everything from our kitchen: traditional mithai, dry fruit sweets, namkeen, snacks and bakes."
      categories={categories}
      searchParams={await searchParams}
    />
  );
}
