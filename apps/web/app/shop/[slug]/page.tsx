import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopView, type ShopSearchParams } from '@/components/shop/shop-view';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { categoryTrail } from '@/lib/categories';

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  const categories = await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []);
  const category = categories.find((c) => c.slug === slug);
  return { categories, category };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await load((await params).slug);
  if (!category) return {};
  return {
    title: `${category.name}: order online`,
    description:
      category.description ??
      `Order fresh ${category.name.toLowerCase()} online, handcrafted daily.`,
    alternates: { canonical: `/shop/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<ShopSearchParams>;
}) {
  const { categories, category } = await load((await params).slug);
  if (!category) notFound();

  const crumbs = [
    { label: 'Shop', href: '/shop' },
    ...categoryTrail(categories, category.id).map((c) => ({
      label: c.name,
      href: `/shop/${c.slug}`,
    })),
  ];

  return (
    <ShopView
      title={category.name}
      description={category.description}
      category={category}
      categories={categories}
      searchParams={await searchParams}
      crumbs={crumbs}
    />
  );
}
