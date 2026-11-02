import Link from 'next/link';
import type { CategoryNode } from '@/lib/categories';
import { ProductImage } from '@/components/product/product-image';

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-page py-14">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron-600">Explore</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Shop by category</h2>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop/${c.slug}`}
            className="group flex w-32 shrink-0 snap-start flex-col items-center text-center sm:w-auto"
          >
            <span className="relative block w-full overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-brand-200 transition group-hover:ring-4 group-hover:ring-saffron-400">
              <ProductImage
                name={c.name}
                slug={c.slug}
                src={c.imageUrl ?? undefined}
                sizes="200px"
                className="aspect-square"
              />
            </span>
            <span className="mt-4 font-display text-lg font-semibold group-hover:text-brand-600">
              {c.name}
            </span>
            {c.children.length > 0 && (
              <span className="text-xs text-cocoa-soft">
                {c.children.length} {c.children.length === 1 ? 'variety' : 'varieties'}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
