'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { Product } from '@sweets/types';
import { Badge, Empty, PageHeader, Pagination, Table, Tabs, Td, inputCls } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { COLLECTIONS, categoryOptions } from '@/lib/catalog';

const PAGE_SIZE = 25;
type Status = 'live' | 'archived';
const filterCls = inputCls.replace('w-full', 'w-auto');
const rupees = (n: number) => formatMoney(n).replace('.00', '');

function priceRange(p: Product) {
  const prices = p.variants.filter((v) => v.isActive).map((v) => Number(v.price));
  if (!prices.length) return '—';
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? rupees(lo) : `${rupees(lo)} – ${rupees(hi)}`;
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ProductsList() {
  const { api } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>('live');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());

  useEffect(() => setPage(1), [status, category, q]);

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.catalog.categories(),
  });
  const options = useMemo(() => categoryOptions(categories.data ?? []), [categories.data]);

  const products = useQuery({
    queryKey: ['products', status, category, q, page],
    queryFn: () =>
      api.catalog.products({
        includeInactive: true,
        isActive: status === 'live',
        category: category || undefined,
        search: q || undefined,
        sort: 'name-asc',
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });
  const counts = useQuery({
    queryKey: ['products', 'counts'],
    queryFn: async () => {
      const [live, archived] = await Promise.all([
        api.catalog.products({ includeInactive: true, isActive: true, pageSize: 1 }),
        api.catalog.products({ includeInactive: true, isActive: false, pageSize: 1 }),
      ]);
      return { live: live.total, archived: archived.total };
    },
  });

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <Link
            href="/products/new"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New product
          </Link>
        }
      />

      <Tabs
        value={status}
        onChange={setStatus}
        tabs={[
          { value: 'live', label: 'Live on shop', count: counts.data?.live },
          { value: 'archived', label: 'Archived', count: counts.data?.archived },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, SKU or tag"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} max-w-xs`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={filterCls}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {options.map(({ category: c, depth }) => (
            <option key={c.id} value={c.slug}>
              {depth ? '   — ' : ''}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {products.error ? (
        <Empty>Couldn’t load products: {products.error.message}</Empty>
      ) : !products.data?.items.length ? (
        <Empty>
          {products.isLoading
            ? 'Loading…'
            : q || category
              ? 'No products match these filters.'
              : status === 'live'
                ? 'No products yet. Create your first one.'
                : 'Nothing archived.'}
        </Empty>
      ) : (
        <>
          <Table head={['Product', 'Category', 'Sizes', 'Price', 'Stock', 'Shop placement']}>
            {products.data.items.map((p) => {
              const live = p.variants.filter((v) => v.isActive);
              const stock = live.reduce((n, v) => n + (v.available ?? 0), 0);
              const low = live.filter((v) => (v.available ?? 0) <= (v.lowStockThreshold ?? 5));
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                          {p.name[0]}
                        </span>
                      )}
                      <div>
                        <Link
                          href={`/products/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium hover:text-brand-700"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-slate-500">/{p.slug}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{p.category?.name}</Td>
                  <Td className="text-xs text-slate-600">
                    {live.map((v) => v.label).join(', ') || '—'}
                  </Td>
                  <Td className="whitespace-nowrap">{priceRange(p)}</Td>
                  <Td className="whitespace-nowrap">
                    <span className={stock === 0 ? 'text-red-700' : ''}>{stock} units</span>
                    {low.length > 0 && stock > 0 && (
                      <div className="text-xs text-amber-700">
                        Low: {low.map((v) => v.label).join(', ')}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {p.isFeatured && <Badge tone="amber">Featured</Badge>}
                      {COLLECTIONS.filter((c) => p.tags.includes(c.tag)).map((c) => (
                        <Badge key={c.tag} tone="blue">
                          {c.label}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={products.data.total}
            onPage={setPage}
          />
        </>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsList />
    </Suspense>
  );
}
