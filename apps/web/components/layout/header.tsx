import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import { site } from '@/lib/site';
import { AccountLink, Announcements, CartButton, CartIconButton } from './header-client';
import { Logo } from './logo';
import { DeliveryBadge } from './pincode-picker';
import { SearchBox } from './search-box';

const PAGES = [
  { href: '/our-story', label: 'Our story' },
  { href: '/contact', label: 'Contact' },
];

const searchFallback = (
  <div className="h-12 w-full rounded-2xl border border-brand-200 bg-white" aria-hidden />
);

export async function Header() {
  const tree = buildCategoryTree(await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []));

  return (
    <>
      <div className="bg-brand-900 px-4 py-2 text-center text-[0.72rem] font-semibold tracking-wide text-saffron-100 sm:text-xs">
        <Announcements items={site.announcements} />
      </div>

      {/* Phones: brand + delivery promise; scrolls away so only search stays pinned. */}
      <div className="container-page flex items-center justify-between gap-3 bg-brand-50 pb-1 pt-3 lg:hidden">
        <Logo compact />
        <div className="flex items-center">
          <AccountLink variant="icon" />
          <CartIconButton />
        </div>
      </div>
      <div className="container-page pb-2 lg:hidden">
        <DeliveryBadge className="py-1" />
      </div>

      <header className="sticky top-0 z-40 border-b border-brand-200/80 bg-brand-50 lg:bg-brand-50/85 lg:backdrop-blur-xl">
        <div className="container-page flex h-[var(--header-h)] items-center gap-6">
          <div className="hidden shrink-0 lg:block">
            <Logo />
          </div>
          <DeliveryBadge className="hidden shrink-0 border-l border-brand-200 pl-6 xl:flex" />
          <div className="min-w-0 flex-1 lg:mx-auto lg:max-w-2xl">
            <Suspense fallback={searchFallback}>
              <SearchBox />
            </Suspense>
          </div>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <AccountLink />
            <CartButton />
          </div>
        </div>
      </header>

      {/* Desktop category bar with hover menus. Pure CSS, so it works before JS loads. */}
      <nav
        aria-label="Categories"
        className="hidden border-b border-brand-200/80 bg-brand-50 lg:block"
      >
        <div className="container-page flex h-12 items-center gap-1 text-[0.85rem] font-semibold">
          <Link href="/shop" className="rounded-full px-3 py-1.5 transition hover:bg-brand-100">
            All products
          </Link>
          {tree.map((cat) => (
            <div key={cat.id} className="group relative">
              <Link
                href={`/shop/${cat.slug}`}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 transition group-hover:bg-brand-100"
              >
                {cat.name}
                {cat.children.length > 0 && (
                  <ChevronDown
                    size={14}
                    className="text-cocoa-soft transition group-hover:rotate-180"
                  />
                )}
              </Link>
              {cat.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-30 pt-2 opacity-0 transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="min-w-56 rounded-2xl border border-brand-200 bg-white p-2 shadow-float">
                    {cat.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/shop/${sub.slug}`}
                          className="block rounded-xl px-3.5 py-2.5 font-medium transition hover:bg-brand-50 hover:text-brand-600"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                    <li className="mt-1 border-t border-brand-100 pt-1">
                      <Link
                        href={`/shop/${cat.slug}`}
                        className="block rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-600 hover:bg-brand-50"
                      >
                        Shop all {cat.name} →
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
          <span className="mx-2 h-4 w-px bg-brand-200" />
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-full px-3 py-1.5 text-cocoa-soft transition hover:bg-brand-100 hover:text-cocoa"
            >
              {p.label}
            </Link>
          ))}
          <p className="ml-auto text-xs font-medium text-cocoa-soft">
            Order before {site.delivery.sameDayCutoff} for{' '}
            <span className="font-bold text-cocoa">same-day delivery</span>
          </p>
        </div>
      </nav>
    </>
  );
}
