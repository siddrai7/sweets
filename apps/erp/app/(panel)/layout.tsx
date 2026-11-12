'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Role } from '@sweets/types';
import {
  CategoriesIcon,
  CloseIcon,
  CouponsIcon,
  DashboardIcon,
  DeliveryIcon,
  InventoryIcon,
  MenuIcon,
  OrdersIcon,
  ProductsIcon,
  PurchaseIcon,
  ReturnsIcon,
  ReviewsIcon,
  SearchIcon,
  SignOutIcon,
  UsersIcon,
  VendorsIcon,
} from '@/components/icons';
import { isErpUser, useAuth } from '@/lib/auth';
import { BRAND } from '@/lib/brand';
import logo from '@/public/logo.png';

type NavItem = { href: string; label: string; roles: Role[]; icon: typeof DashboardIcon };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Today',
    items: [
      { href: '/', label: 'Dashboard', roles: ['ADMIN', 'STAFF'], icon: DashboardIcon },
      { href: '/orders', label: 'Orders', roles: ['ADMIN', 'STAFF'], icon: OrdersIcon },
      { href: '/returns', label: 'Returns', roles: ['ADMIN', 'STAFF'], icon: ReturnsIcon },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/products', label: 'Products', roles: ['ADMIN', 'STAFF'], icon: ProductsIcon },
      { href: '/categories', label: 'Categories', roles: ['ADMIN', 'STAFF'], icon: CategoriesIcon },
      { href: '/inventory', label: 'Inventory', roles: ['ADMIN', 'STAFF'], icon: InventoryIcon },
    ],
  },
  {
    title: 'Supply',
    items: [
      {
        href: '/purchase-orders',
        label: 'Purchase orders',
        roles: ['ADMIN', 'STAFF', 'VENDOR'],
        icon: PurchaseIcon,
      },
      { href: '/vendors', label: 'Vendors', roles: ['ADMIN', 'STAFF'], icon: VendorsIcon },
    ],
  },
  {
    title: 'Customers',
    items: [
      { href: '/coupons', label: 'Coupons', roles: ['ADMIN', 'STAFF'], icon: CouponsIcon },
      { href: '/reviews', label: 'Reviews', roles: ['ADMIN', 'STAFF'], icon: ReviewsIcon },
      { href: '/delivery', label: 'Delivery', roles: ['ADMIN', 'STAFF'], icon: DeliveryIcon },
      {
        href: '/search-report',
        label: 'Customer searches',
        roles: ['ADMIN', 'STAFF'],
        icon: SearchIcon,
      },
    ],
  },
  { title: 'Team', items: [{ href: '/users', label: 'Users', roles: ['ADMIN'], icon: UsersIcon }] },
];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  VENDOR: 'Vendor',
  CUSTOMER: 'Customer',
};

const BADGE_TITLE: Record<string, string> = {
  '/returns': 'to review',
  '/reviews': 'waiting for approval',
  '/inventory': 'items low on stock',
};

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
  const pendingReviews = useQuery({
    queryKey: ['reviews', 'pending-count'],
    queryFn: () => api.reviews.list({ status: 'PENDING', pageSize: 1 }),
    enabled: canSeeStock,
    refetchInterval: 120_000,
  });
  const badges: Record<string, number | undefined> = {
    '/reviews': pendingReviews.data?.total,
    '/inventory': lowStock.data?.length,
    '/returns': openReturns.data?.total,
  };
  const router = useRouter();
  const pathname = usePathname();
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((n) => user && n.roles.includes(user.role)),
  })).filter((g) => g.items.length);
  const nav = groups.flatMap((g) => g.items);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const allowed = nav.some((n) => isActive(n.href));
  // Phones: the sidebar is a drawer, closed again on every navigation.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  const home = nav[0]?.href;

  useEffect(() => {
    if (!ready) return;
    if (!user || !isErpUser(user)) router.replace('/login');
    else if (!allowed && home) router.replace(home);
  }, [ready, user, allowed, home, router]);

  if (!ready || !user || !allowed) return null;

  return (
    <div className="min-h-screen lg:flex">
      {/* Phone top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between bg-brand-900 px-4 py-2.5 text-white lg:hidden">
        <span className="flex items-center gap-2.5">
          <Image src={logo} alt="" sizes="36px" className="h-9 w-auto" priority />
          <span className="font-display text-lg">{BRAND}</span>
        </span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 hover:bg-white/10"
        >
          <MenuIcon size={22} />
        </button>
      </div>
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="no-print fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-brand-900 text-brand-100 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(80%_100%_at_30%_0%,rgb(163_34_47/0.45),transparent)]" />
        <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
          <Image src={logo} alt="" sizes="56px" className="h-14 w-auto drop-shadow-lg" priority />
          <span className="leading-tight">
            <span className="block font-display text-[1.25rem] text-white">{BRAND}</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-saffron-400">
              Back office
            </span>
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-1.5 text-brand-200 hover:bg-white/10 lg:hidden"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="relative flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-300/70">
                {g.title}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((n) => {
                  const active = isActive(n.href);
                  const Icon = n.icon;
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                          active
                            ? 'bg-white/10 font-semibold text-white'
                            : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {active && (
                          <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-saffron-400" />
                        )}
                        <Icon
                          className={
                            active
                              ? 'text-saffron-300'
                              : 'text-brand-300 group-hover:text-saffron-300'
                          }
                        />
                        <span className="flex-1">{n.label}</span>
                        {!!badges[n.href] && (
                          <span
                            className="rounded-full bg-saffron-400 px-1.5 text-[0.68rem] font-bold leading-[1.15rem] text-brand-900"
                            title={`${badges[n.href]} ${BADGE_TITLE[n.href] ?? ''}`}
                          >
                            {badges[n.href]}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="relative flex items-center gap-3 border-t border-white/10 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-400/15 font-display text-lg text-saffron-300 ring-1 ring-saffron-400/40">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
            <span className="text-xs text-brand-300">{ROLE_LABEL[user.role]}</span>
          </span>
          <button
            onClick={() => void signOut()}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-2 text-brand-200 transition hover:bg-white/10 hover:text-white"
          >
            <SignOutIcon />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[88rem] animate-rise">{children}</div>
      </main>
    </div>
  );
}
