'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatMoney } from '@sweets/api-client';
import {
  AlertIcon,
  ArrowRightIcon,
  ClockIcon,
  CouponsIcon,
  DeliveryIcon,
  InventoryIcon,
  OrdersIcon,
  PlusIcon,
  RupeeIcon,
} from '@/components/icons';
import { Badge, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { STATUS_TONE, statusLabel } from '@/lib/orders';

const SHORTCUTS = [
  {
    href: '/inventory',
    label: 'Record production',
    hint: 'Add today’s batches',
    icon: InventoryIcon,
  },
  { href: '/products/new', label: 'Add a product', hint: 'New sweet or snack', icon: PlusIcon },
  { href: '/coupons', label: 'Create a coupon', hint: 'Offers and codes', icon: CouponsIcon },
  { href: '/delivery', label: 'Delivery areas', hint: 'Pincodes and slots', icon: DeliveryIcon },
];

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { api, user } = useAuth();
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard.stats,
    refetchInterval: 30_000,
  });
  const lowStock = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: api.inventory.lowStock,
    refetchInterval: 60_000,
  });
  const latest = useQuery({
    queryKey: ['orders', 'latest'],
    queryFn: () => api.orders.list({ page: 1, pageSize: 6 }),
    refetchInterval: 30_000,
  });

  const now = new Date();
  const tiles = [
    {
      label: 'Orders to fulfil',
      value: data?.pendingOrders,
      href: '/orders',
      action: 'Open orders',
      icon: ClockIcon,
      alert: false,
    },
    {
      label: 'Low-stock items',
      value: data?.lowStockVariants,
      href: '/inventory#low-stock',
      action: 'Restock',
      icon: InventoryIcon,
      alert: !!data?.lowStockVariants,
    },
    {
      label: 'Batches expiring in 48 h',
      value: data?.expiringBatches,
      href: '/inventory',
      action: 'Review batches',
      icon: AlertIcon,
      alert: !!data?.expiringBatches,
    },
  ];

  return (
    <>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-saffron-600">
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1.5 text-[2rem] font-medium leading-tight text-brand-900 sm:text-[2.6rem]">
          {greeting(now.getHours())}, <em className="text-brand-600">{user?.name.split(' ')[0]}</em>
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_2fr]">
        {/* Today's takings: the one number everyone looks for first. */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 p-6 text-brand-100 shadow-card sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/50 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-saffron-300">
              Revenue today
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-saffron-300">
              <RupeeIcon />
            </span>
          </div>
          <p className="relative mt-5 font-display text-5xl text-white tabular-nums sm:text-6xl">
            {data ? formatMoney(data.revenueToday) : '—'}
          </p>
          <div className="relative mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-sm">
            <span>
              <span className="font-display text-2xl text-white">{data?.ordersToday ?? '—'}</span>{' '}
              order{data?.ordersToday === 1 ? '' : 's'} today
            </span>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 font-semibold text-saffron-300 hover:text-saffron-100"
            >
              All orders <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`group flex flex-col rounded-2xl border p-3.5 shadow-card transition hover:-translate-y-0.5 sm:rounded-3xl sm:p-5 ${
                t.alert
                  ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  t.alert ? 'bg-amber-200/70 text-amber-800' : 'bg-saffron-100 text-saffron-600'
                }`}
              >
                <t.icon />
              </span>
              <p className="mt-3 font-display text-4xl tabular-nums text-brand-900 sm:mt-5 sm:text-5xl">
                {t.value ?? '—'}
              </p>
              <p
                className={`mt-1 text-xs leading-snug sm:text-sm ${t.alert ? 'text-amber-900' : 'text-slate-600'}`}
              >
                {t.label}
              </p>
              <span className="mt-auto hidden items-center gap-1.5 pt-4 text-xs font-bold uppercase tracking-wider text-brand-600 sm:inline-flex">
                {t.action}
                <ArrowRightIcon size={13} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1.25fr]">
        <Card className="min-w-0 !p-0">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <h2 className="font-display text-xl text-brand-900">Latest orders</h2>
            <Link href="/orders" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {latest.data?.items.length ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
              {latest.data.items.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex items-center gap-2.5 px-4 py-3 transition hover:bg-saffron-50/60 sm:gap-3 sm:px-5"
                  >
                    <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:flex">
                      <OrdersIcon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {o.customer?.name ?? 'Guest'}
                      </span>
                      <span className="font-mono text-xs text-slate-500">{o.orderNumber}</span>
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{statusLabel(o.status)}</Badge>
                    <span className="w-[4.5rem] shrink-0 text-right font-semibold tabular-nums sm:w-20">
                      {formatMoney(o.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-500">
              {latest.isLoading ? 'Loading…' : 'No orders yet. They will show up here.'}
            </p>
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="font-display text-xl text-brand-900">Shortcuts</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2.5">
              {SHORTCUTS.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-saffron-400 hover:bg-saffron-50"
                  >
                    <span className="text-brand-600">
                      <s.icon />
                    </span>
                    <span className="text-sm font-semibold leading-tight">{s.label}</span>
                    <span className="text-xs text-slate-500">{s.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {!!lowStock.data?.length && (
            <Card>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-display text-xl text-brand-900">Running low</h2>
                <Link
                  href="/inventory#low-stock"
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  Restock
                </Link>
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {lowStock.data.slice(0, 6).map((r) => (
                  <li key={r.variantId} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.productName}</span>
                      <span className="text-xs text-slate-500">{r.variantLabel}</span>
                    </span>
                    <Badge tone={r.available === 0 ? 'red' : 'amber'}>
                      {r.available === 0 ? 'Sold out' : `${r.available} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
              {lowStock.data.length > 6 && (
                <p className="mt-2 text-xs text-slate-500">
                  and {lowStock.data.length - 6} more on the Inventory page.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
