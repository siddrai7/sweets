'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Role } from '@sweets/types';
import { isErpUser, useAuth } from '@/lib/auth';

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: '/', label: 'Dashboard', roles: ['ADMIN', 'STAFF'] },
  { href: '/orders', label: 'Orders', roles: ['ADMIN', 'STAFF'] },
  { href: '/returns', label: 'Returns', roles: ['ADMIN', 'STAFF'] },
  { href: '/products', label: 'Products', roles: ['ADMIN', 'STAFF'] },
  { href: '/categories', label: 'Categories', roles: ['ADMIN', 'STAFF'] },
  { href: '/inventory', label: 'Inventory', roles: ['ADMIN', 'STAFF'] },
  { href: '/purchase-orders', label: 'Purchase orders', roles: ['ADMIN', 'STAFF', 'VENDOR'] },
  { href: '/vendors', label: 'Vendors', roles: ['ADMIN', 'STAFF'] },
  { href: '/users', label: 'Users', roles: ['ADMIN'] },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, signOut, api } = useAuth();
  // Sidebar badge: how many sizes need restocking. Shares its cache with the Inventory page.
  const canSeeStock = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const lowStock = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: api.inventory.lowStock,
    enabled: canSeeStock,
    refetchInterval: 60_000,
  });
  const openReturns = useQuery({
    queryKey: ['returns', 'open-count'],
    queryFn: () => api.returns.list({ status: 'REQUESTED', pageSize: 1 }),
    enabled: canSeeStock,
    refetchInterval: 60_000,
  });
  const badges: Record<string, number | undefined> = {
    '/inventory': lowStock.data?.length,
    '/returns': openReturns.data?.total,
  };
  const router = useRouter();
  const pathname = usePathname();
  const nav = user ? NAV.filter((n) => n.roles.includes(user.role)) : [];
  const allowed = nav.some((n) =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href),
  );
  const home = nav[0]?.href;

  useEffect(() => {
    if (!ready) return;
    if (!user || !isErpUser(user)) router.replace('/login');
    else if (!allowed && home) router.replace(home);
  }, [ready, user, allowed, home, router]);

  if (!ready || !user || !allowed) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="no-print flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 text-lg font-semibold text-brand-700">Sweets ERP</div>
        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block rounded-lg px-3 py-2 text-sm ${active ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex items-center justify-between">
                  {n.label}
                  {!!badges[n.href] && (
                    <span
                      className="rounded-full bg-red-600 px-1.5 text-[0.65rem] font-semibold leading-4 text-white"
                      title={
                        n.href === '/returns'
                          ? `${badges[n.href]} to review`
                          : `${badges[n.href]} items low on stock`
                      }
                    >
                      {badges[n.href]}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-slate-500">{user.role}</p>
          <button
            onClick={() => void signOut()}
            className="mt-2 text-xs text-slate-500 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
