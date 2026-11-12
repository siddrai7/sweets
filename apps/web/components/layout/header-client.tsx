'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/money';
import { BagIcon, UserIcon } from '@/components/ui/icons';
import { useCart } from '@/lib/cart';
import { useSession } from '@/lib/session';

/** Thin top bar that cycles through short announcements. */
export function Announcements({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <div className="relative h-5 overflow-hidden" aria-live="polite">
      {items.map((text, n) => (
        <p
          key={text}
          className={`absolute inset-0 flex items-center justify-center transition duration-500 ${
            n === i
              ? 'translate-y-0 opacity-100'
              : n < i
                ? '-translate-y-full opacity-0'
                : 'translate-y-full opacity-0'
          }`}
          aria-hidden={n !== i}
        >
          {text}
        </p>
      ))}
    </div>
  );
}

export function AccountLink({ variant = 'full' }: { variant?: 'full' | 'icon' }) {
  const { user } = useSession();
  const href = user ? '/account/orders' : '/login';

  if (variant === 'icon') {
    return (
      <Link
        href={href}
        className="rounded-full p-2.5 transition hover:bg-brand-100"
        aria-label={user ? 'My account' : 'Sign in'}
      >
        <UserIcon size={22} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-2xl px-3 py-2 transition hover:bg-brand-100"
    >
      <UserIcon size={22} />
      <span className="flex flex-col text-left leading-tight">
        <span className="text-xs text-cocoa-soft">
          {user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, sign in'}
        </span>
        <span className="text-sm font-bold">{user ? 'Orders & account' : 'Account'}</span>
      </span>
    </Link>
  );
}

/** Desktop cart button: shows item count and running total once something is in the cart. */
export function CartButton() {
  const { count, subtotal, openCart, loaded, lastAdded } = useCart();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [lastAdded]);

  const filled = loaded && count > 0;
  return (
    <button
      onClick={openCart}
      className={`flex h-12 items-center gap-2.5 rounded-2xl px-4 text-sm font-bold transition ${
        filled
          ? 'bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgb(134_20_36/0.9)] hover:bg-brand-700'
          : 'border border-brand-200 bg-white hover:border-cocoa/30'
      } ${bump ? 'animate-pop' : ''}`}
      aria-label={`Cart, ${count} items`}
    >
      <BagIcon size={20} />
      {filled ? (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold opacity-80">
            {count} item{count > 1 ? 's' : ''}
          </span>
          <span className="tabular-nums">{formatMoney(subtotal)}</span>
        </span>
      ) : (
        <span>My cart</span>
      )}
    </button>
  );
}

/** Small bag icon with a badge, for the compact mobile header. */
export function CartIconButton() {
  const { count, openCart, loaded } = useCart();
  return (
    <button
      onClick={openCart}
      className="relative rounded-full p-2.5 transition hover:bg-brand-100"
      aria-label={`Cart, ${count} items`}
    >
      <BagIcon size={22} />
      {loaded && count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
