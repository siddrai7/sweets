'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BagIcon,
  ChevronDown,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '@/components/ui/icons';
import type { CategoryNode } from '@/lib/categories';
import { useCart } from '@/lib/cart';
import { useSession } from '@/lib/session';
import { site } from '@/lib/site';

export function HeaderActions() {
  const { count, openCart } = useCart();
  const { user } = useSession();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <div className="ml-auto flex items-center gap-1">
      {searchOpen ? (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = inputRef.current?.value.trim();
            if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
            setSearchOpen(false);
          }}
          className="absolute inset-x-0 top-full z-10 border-b border-brand-200 bg-white p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0"
        >
          <input
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Search sweets, namkeen…"
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            className="input-field sm:w-64"
          />
        </form>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="rounded-full p-2.5 hover:bg-brand-100"
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      )}
      <Link
        href={user ? '/account/orders' : '/login'}
        className="hidden rounded-full p-2.5 hover:bg-brand-100 sm:block"
        aria-label={user ? 'My account' : 'Sign in'}
      >
        <UserIcon />
      </Link>
      <button
        onClick={openCart}
        className="relative rounded-full p-2.5 hover:bg-brand-100"
        aria-label={`Cart, ${count} items`}
      >
        <BagIcon />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[0.65rem] font-bold text-white">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}

export function MobileMenu({
  tree,
  pages,
}: {
  tree: CategoryNode[];
  pages: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const { user } = useSession();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="-ml-2 rounded-full p-2.5 hover:bg-brand-100 lg:hidden"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="absolute inset-0 animate-fade-in bg-cocoa/40"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-brand-50">
            <div className="flex items-center justify-between border-b border-brand-200 px-5 py-4">
              <span className="font-display text-xl font-semibold text-brand-600">{site.name}</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-brand-100"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            <ul className="flex-1 divide-y divide-brand-200 px-5">
              <li>
                <Link href="/" className="block py-4 font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="block py-4 font-medium">
                  Shop all
                </Link>
              </li>
              {tree.map((cat) => (
                <li key={cat.id}>
                  <div className="flex items-center justify-between">
                    <Link href={`/shop/${cat.slug}`} className="flex-1 py-4 font-medium">
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 && (
                      <button
                        onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                        className="p-3"
                        aria-label={`Show ${cat.name} categories`}
                        aria-expanded={expanded === cat.id}
                      >
                        <ChevronDown
                          className={`transition ${expanded === cat.id ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                  {expanded === cat.id && (
                    <ul className="space-y-3 pb-4 pl-4">
                      {cat.children.map((sub) => (
                        <li key={sub.id}>
                          <Link href={`/shop/${sub.slug}`} className="text-sm text-cocoa-soft">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="block py-4 font-medium">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-brand-200 p-5">
              <Link href={user ? '/account/orders' : '/login'} className="btn-outline w-full">
                <UserIcon size={18} /> {user ? 'My account' : 'Sign in / Register'}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
