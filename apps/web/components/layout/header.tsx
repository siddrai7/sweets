import Link from 'next/link';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import { site } from '@/lib/site';
import { HeaderActions, MobileMenu } from './header-client';

const PAGES = [
  { href: '/our-story', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
];

export async function Header() {
  const tree = buildCategoryTree(await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []));

  return (
    <>
      <div className="bg-brand-700 px-4 py-2 text-center text-xs font-medium tracking-wide text-brand-50 sm:text-sm">
        {site.announcement}
      </div>
      <header className="sticky top-0 z-40 border-b border-brand-200 bg-brand-50/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-4 lg:h-20">
          <MobileMenu tree={tree} pages={PAGES} />

          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl font-semibold text-brand-600 lg:text-[1.7rem]">
              {site.name}
            </span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-saffron-600">
              Estd. {site.established}
            </span>
          </Link>

          <nav className="ml-10 hidden h-full items-center gap-1 lg:flex" aria-label="Main">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium hover:text-brand-600"
            >
              Home
            </Link>

            {/* Mega menu: pure CSS hover/focus, so it works before JS loads. */}
            <div className="group flex h-full items-center">
              <Link
                href="/shop"
                className="rounded-full px-4 py-2 text-sm font-medium group-hover:text-brand-600"
              >
                Shop
              </Link>
              <div className="invisible absolute inset-x-0 top-full border-b border-brand-200 bg-white opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="container-page grid grid-cols-5 gap-8 py-8">
                  {tree.map((cat) => (
                    <div key={cat.id}>
                      <Link
                        href={`/shop/${cat.slug}`}
                        className="font-display text-lg font-semibold text-brand-600 hover:underline"
                      >
                        {cat.name}
                      </Link>
                      {cat.children.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {cat.children.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/shop/${sub.slug}`}
                                className="text-sm text-cocoa-soft hover:text-brand-600"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-full px-4 py-2 text-sm font-medium hover:text-brand-600"
              >
                {p.label}
              </Link>
            ))}
          </nav>

          <HeaderActions />
        </div>
      </header>
    </>
  );
}
