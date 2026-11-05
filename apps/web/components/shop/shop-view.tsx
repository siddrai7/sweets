import Link from 'next/link';
import { Suspense } from 'react';
import type { Category, ProductQuery } from '@sweets/types';
import { ArtImage } from '@/components/art/art-image';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { artFor } from '@/lib/art';
import { buildCategoryTree, categoryTrail } from '@/lib/categories';
import { PRICE_BANDS } from '@/lib/price-bands';
import { Breadcrumbs, type Crumb } from './breadcrumbs';
import { ProductGrid } from './product-grid';
import { SearchLogger } from './search-logger';
import { ActiveFilters, Filters, MobileControls, SortSelect } from './shop-controls';

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
  const chips = parent
    ? [
        { id: parent.id, slug: parent.slug, label: 'All' },
        ...parent.children.map((c) => ({ id: c.id, slug: c.slug, label: c.name })),
      ]
    : [
        { id: 'all', slug: '', label: 'All' },
        ...tree.map((c) => ({ id: c.id, slug: c.slug, label: c.name })),
      ];
  const activeChip = category?.id ?? (searchParams.q ? undefined : 'all');
  const art = artFor(category?.slug ?? searchParams.tag ?? 'assorted', heading);

  return (
    <div className="pb-6">
      {/* Title band */}
      <div
        className="relative overflow-hidden border-b border-brand-200/70"
        style={{ backgroundColor: art.tone.bg }}
      >
        <div className="container-page relative py-6 sm:py-10">
          <Breadcrumbs items={crumbs ?? [{ label: heading, href: '/shop' }]} />
          <div className="mt-4 max-w-2xl pr-24 sm:pr-0">
            <h1 className="text-[2.1rem] font-light leading-[1.05] sm:text-6xl">{heading}</h1>
            {description && (
              <p className="mt-3 text-sm text-cocoa-soft sm:text-lg">{description}</p>
            )}
            {searchParams.q && initial.suggestion ? (
              <p className="mt-3 text-sm text-cocoa-soft">
                No exact match for “{searchParams.q}”. Showing close matches. Did you mean{' '}
                <Link
                  href={`/search?q=${encodeURIComponent(initial.suggestion)}`}
                  className="font-bold text-brand-600 underline underline-offset-2"
                >
                  {initial.suggestion}
                </Link>
                ?
              </p>
            ) : (
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-cocoa-soft">
                {initial.total} {initial.total === 1 ? 'product' : 'products'}
              </p>
            )}
            {searchParams.q && <SearchLogger q={searchParams.q} />}
          </div>
          <ArtImage
            hints={[category?.slug ?? searchParams.tag ?? 'assorted', heading]}
            background={false}
            className="pointer-events-none absolute -bottom-6 right-0 h-36 w-36 sm:right-10 sm:h-60 sm:w-60"
          />
        </div>
      </div>

      {/* Sticky category chips + phone controls */}
      <div className="sticky top-[var(--header-h)] z-30 border-b border-brand-200/70 bg-brand-50/90 backdrop-blur-xl">
        <div className="container-page space-y-2.5 py-3">
          <nav
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
            aria-label="Categories"
          >
            {chips.map((c) => (
              <Link
                key={c.id}
                href={c.slug ? `/shop/${c.slug}` : '/shop'}
                className={`chip ${c.id === activeChip ? 'chip-active' : ''}`}
                aria-current={c.id === activeChip ? 'page' : undefined}
              >
                {c.label}
              </Link>
            ))}
          </nav>
          <Suspense>
            <MobileControls />
          </Suspense>
        </div>
      </div>

      <div className="container-page mt-6 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+5rem)] space-y-8">
            <nav aria-label="All categories">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cocoa-soft">
                Categories
              </p>
              <ul className="space-y-0.5 text-sm">
                {tree.map((c) => {
                  const open = trail[0]?.id === c.id;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/shop/${c.slug}`}
                        className={`block rounded-xl px-3 py-2 font-semibold transition hover:bg-brand-100 ${category?.id === c.id ? 'bg-white text-brand-600 ring-1 ring-brand-200' : ''}`}
                      >
                        {c.name}
                      </Link>
                      {open && c.children.length > 0 && (
                        <ul className="mb-2 ml-3 mt-1 space-y-0.5 border-l border-brand-200 pl-3">
                          {c.children.map((s) => (
                            <li key={s.id}>
                              <Link
                                href={`/shop/${s.slug}`}
                                className={`block rounded-lg px-2.5 py-1.5 transition hover:text-brand-600 ${category?.id === s.id ? 'font-bold text-brand-600' : 'text-cocoa-soft'}`}
                              >
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            <Suspense>
              <Filters />
            </Suspense>
          </div>
        </aside>

        <div>
          <div className="mb-4 hidden items-center justify-between gap-3 lg:flex">
            <p className="text-sm text-cocoa-soft">
              <span className="font-bold text-cocoa">{initial.total}</span> products
            </p>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          <Suspense>
            <ActiveFilters />
          </Suspense>
          <ProductGrid initial={initial} query={query} />
        </div>
      </div>
    </div>
  );
}
