'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatMoney } from '@sweets/api-client';
import { Badge, Card, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { api } = useAuth();
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

  const tiles = [
    { label: 'Orders today', value: data?.ordersToday, href: '/orders' },
    { label: 'Revenue today', value: data && formatMoney(data.revenueToday) },
    { label: 'Orders to fulfil', value: data?.pendingOrders, href: '/orders' },
    {
      label: 'Low-stock items',
      value: data?.lowStockVariants,
      href: '/inventory#low-stock',
      alert: !!data?.lowStockVariants,
    },
    {
      label: 'Batches expiring in 48 h',
      value: data?.expiringBatches,
      href: '/inventory',
      alert: !!data?.expiringBatches,
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tiles.map((t) => {
          const body = (
            <div
              className={`h-full rounded-xl border p-5 transition ${
                t.alert ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
              } ${t.href ? 'hover:border-slate-400' : ''}`}
            >
              <p className={`text-xs ${t.alert ? 'text-amber-800' : 'text-slate-500'}`}>
                {t.label}
              </p>
              <p className="mt-1 text-2xl font-semibold">{t.value ?? '—'}</p>
            </div>
          );
          return t.href ? (
            <Link key={t.label} href={t.href}>
              {body}
            </Link>
          ) : (
            <div key={t.label}>{body}</div>
          );
        })}
      </div>

      {!!lowStock.data?.length && (
        <Card className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-medium">Running low</h2>
            <Link href="/inventory#low-stock" className="text-sm text-brand-700 hover:underline">
              Restock on Inventory →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {lowStock.data.slice(0, 6).map((r) => (
              <li key={r.variantId} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {r.productName} <span className="text-slate-500">· {r.variantLabel}</span>
                </span>
                <Badge tone={r.available === 0 ? 'red' : 'amber'}>
                  {r.available === 0
                    ? 'Sold out'
                    : `${r.available} left (alert at ${r.lowStockThreshold})`}
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
    </>
  );
}
