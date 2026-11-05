'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogoutIcon } from '@/components/ui/icons';
import { useSession } from '@/lib/session';

const TABS = [
  { href: '/account/orders', label: 'My orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

/** Greeting, account tabs and sign out, shared by the account pages. */
export function AccountHeader({ title }: { title: string }) {
  const { user, signOut } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{user ? `Hello, ${user.name.split(' ')[0]}` : 'Account'}</p>
          <h1 className="mt-2 text-4xl font-light sm:text-5xl">{title}</h1>
        </div>
        {user && (
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            className="flex items-center gap-1.5 text-sm font-semibold text-cocoa-soft hover:text-brand-600"
          >
            <LogoutIcon size={16} /> Sign out
          </button>
        )}
      </div>
      <nav className="mt-6 flex gap-2" aria-label="Account">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={pathname.startsWith(t.href) ? 'page' : undefined}
            className={`chip ${pathname.startsWith(t.href) ? 'chip-active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
