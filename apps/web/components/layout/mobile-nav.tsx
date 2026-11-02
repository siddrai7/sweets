'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/money';
import { ProductImage } from '@/components/product/product-image';
import { ChevronRight, GridIcon, HomeIcon, ReceiptIcon, SearchIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { OPEN_SEARCH_EVENT } from '@/lib/events';
import { useSession } from '@/lib/session';

/** Routes with their own bottom action bar, or where browsing chrome would distract. */
const FOCUSED = [/^\/products\//, /^\/cart/, /^\/checkout/, /^\/login/];

/** App-style bottom navigation and floating cart bar for phones. */
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useSession();
  if (FOCUSED.some((re) => re.test(pathname))) return null;

  const tabs = [
    { href: '/', label: 'Home', icon: HomeIcon, active: pathname === '/' },
    {
      href: '/categories',
      label: 'Categories',
      icon: GridIcon,
      active: pathname.startsWith('/categories') || pathname.startsWith('/shop'),
    },
    {
      href: user ? '/account/orders' : '/login?next=/account/orders',
      label: 'Orders',
      icon: ReceiptIcon,
      active: pathname.startsWith('/account'),
    },
  ];

  return (
    <>
      <FloatingCartBar />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid h-16 grid-cols-4">
          {tabs.slice(0, 2).map((t) => (
            <Tab key={t.label} {...t} />
          ))}
          <li>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
              }}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold text-cocoa-soft"
            >
              <SearchIcon size={22} />
              Search
            </button>
          </li>
          <Tab {...tabs[2]!} />
        </ul>
      </nav>
    </>
  );
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof HomeIcon;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex h-full flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold transition ${
          active ? 'text-brand-600' : 'text-cocoa-soft'
        }`}
      >
        {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600" />}
        <Icon size={22} strokeWidth={active ? 2.1 : 1.75} />
        {label}
      </Link>
    </li>
  );
}

/** Blinkit-style "n items · ₹total  View cart ›" bar that follows the customer around. */
function FloatingCartBar() {
  const { lines, count, subtotal, openCart, loaded, lastAdded } = useCart();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [lastAdded]);

  if (!loaded || count === 0) return null;
  const thumbs = lines.slice(-3).reverse();

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.6rem)] z-40 px-3 lg:hidden">
      <button
        onClick={openCart}
        className={`flex w-full animate-rise items-center gap-3 rounded-2xl bg-brand-600 py-2.5 pl-2.5 pr-4 text-white shadow-float ${bump ? 'animate-pop' : ''}`}
      >
        <span className="flex -space-x-3">
          {thumbs.map((l) => (
            <ProductImage
              key={l.variantId}
              name={l.productName}
              slug={l.productSlug}
              src={l.image}
              sizes="36px"
              className="h-9 w-9 rounded-xl ring-2 ring-brand-600"
            />
          ))}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[0.72rem] font-semibold opacity-80">
            {count} item{count > 1 ? 's' : ''}
          </span>
          <span className="font-extrabold tabular-nums">{formatMoney(subtotal)}</span>
        </span>
        <span className="ml-auto flex items-center gap-1 font-bold">
          View cart <ChevronRight size={18} />
        </span>
      </button>
    </div>
  );
}

/** Desktop confirmation after adding an item; phones get the floating cart bar instead. */
export function CartToast() {
  const { lastAdded, openCart, isOpen } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, [lastAdded]);

  if (!visible || !lastAdded || isOpen) return null;
  const { line } = lastAdded;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 hidden w-[22rem] animate-rise items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-float lg:flex"
    >
      <ProductImage
        name={line.productName}
        slug={line.productSlug}
        src={line.image}
        sizes="48px"
        className="h-12 w-12 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-pista-600">Added to cart</p>
        <p className="truncate text-sm font-semibold">
          {line.productName} · {line.variantLabel}
        </p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          openCart();
        }}
        className="shrink-0 rounded-xl bg-cocoa px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"
      >
        View cart
      </button>
    </div>
  );
}
