import Link from 'next/link';
import { Suspense } from 'react';
import type { Category, ProductQuery } from '@sweets/types';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree, categoryTrail } from '@/lib/categories';
import { Breadcrumbs, type Crumb } from './breadcrumbs';
import { ProductGrid } from './product-grid';
import { PRICE_BANDS } from '@/lib/price-bands';
import { Filters, SortSelect } from './shop-controls';

export type ShopSearchParams = {
  sort?: string;
  price?: string;
  inStock?: string;
  tag?: string;
  q?: string;
};

const PAGE_SIZE = 24;

const COLLECTION_TITLES: Record<string, string> = {
  bestseller: 'Bestsellers',
  favourite: 'All-time favourites',
  classic: 'The classics',
};

interface Props {
  title: string;
  description?: string | null;
  category?: Category;
  categories: Category[];
  searchParams: ShopSearchParams;
  crumbs?: Crumb[];
}

export async function ShopView({
  title,
  description,
  category,
  categories,
  searchParams,
  crumbs,
}: Props) {
  const band = PRICE_BANDS.find((b) => b.id === searchParams.price);
  const query: Partial<ProductQuery> = {
    category: category?.slug,
    tag: searchParams.tag,
    search: searchParams.q,
    sort: (searchParams.sort as ProductQuery['sort']) ?? 'featured',
    inStock: searchParams.inStock === 'true' || undefined,
    minPrice: band && 'min' in band ? band.min : undefined,
    maxPrice: band && 'max' in band ? band.max : undefined,
  };
  const initial = await safe(
    serverApi.catalog.products({ ...query, pageSize: PAGE_SIZE }, CATALOG_REVALIDATE),
    {
      items: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
    },
  );

  // Sub-category chips: a parent shows its children; a child shows its siblings.
  const tree = buildCategoryTree(categories);
  const trail = categoryTrail(categories, category?.id);
  const parent = trail.length ? tree.find((c) => c.id === trail[0]!.id) : undefined;
  const heading =
    searchParams.tag && COLLECTION_TITLES[searchParams.tag]
      ? COLLECTION_TITLES[searchParams.tag]!
      : title;

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={crumbs ?? [{ label: heading, href: '/shop' }]} />

      <header className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">{heading}</h1>
        {description && <p className="mt-3 text-lg text-cocoa-soft">{description}</p>}
      </header>

      <nav
        className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        aria-label="Categories"
      >
        {(parent
          ? [
              { ...parent, label: `All ${parent.name}` },
              ...parent.children.map((c) => ({ ...c, label: c.name })),
            ]
          : tree.map((c) => ({ ...c, label: c.name }))
        ).map((c) => {
          const active = c.id === category?.id;
          return (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-brand-200 bg-white hover:border-brand-600'
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Suspense>
              <Filters />
            </Suspense>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-brand-200 pb-4">
            <details className="relative lg:hidden">
              <summary className="cursor-pointer list-none rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium">
                Filters
              </summary>
              <div className="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-brand-200 bg-white p-5 shadow-lg">
                <Suspense>
                  <Filters />
                </Suspense>
              </div>
            </details>
            <p className="hidden text-sm text-cocoa-soft lg:block">{initial.total} products</p>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          <ProductGrid initial={initial} query={query} />
        </div>
      </div>
    </div>
  );
}
