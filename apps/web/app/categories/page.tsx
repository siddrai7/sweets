import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryTile } from '@/components/home/category-tiles';
import { ArrowRight } from '@/components/ui/icons';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All categories',
  description: 'Browse every category: desi sweets, dry fruit mithai, namkeen, snacks and bakery.',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const tree = buildCategoryTree(await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []));

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">Browse</p>
      <h1 className="mt-2 text-4xl font-light sm:text-5xl">All categories</h1>

      <div className="mt-8 space-y-10">
        {tree.map((cat) => (
          <section key={cat.id}>
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-brand-200 pb-3">
              <div>
                <h2 className="text-2xl font-normal">{cat.name}</h2>
                {cat.description && (
                  <p className="mt-1 text-sm text-cocoa-soft">{cat.description}</p>
                )}
              </div>
              <Link
                href={`/shop/${cat.slug}`}
                className="flex shrink-0 items-center gap-1 text-sm font-bold text-brand-600"
              >
                See all <ArrowRight size={15} />
              </Link>
            </div>
            <ul className="grid grid-cols-4 gap-x-2.5 gap-y-5 sm:grid-cols-6 lg:grid-cols-8">
              {(cat.children.length ? cat.children : [cat]).map((c) => (
                <li key={c.id}>
                  <CategoryTile category={c} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {[
          {
            href: '/our-story',
            title: 'Our story',
            body: 'A new kitchen, and how we make things.',
          },
          { href: '/contact', title: 'Need help?', body: 'Bulk orders, gifting and questions.' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card flex items-center justify-between p-5 transition hover:border-brand-300"
          >
            <span>
              <span className="block font-display text-xl">{l.title}</span>
              <span className="text-sm text-cocoa-soft">{l.body}</span>
            </span>
            <ArrowRight />
          </Link>
        ))}
      </div>
    </div>
  );
}
