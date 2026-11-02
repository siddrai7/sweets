'use client';

import { useQuery } from '@tanstack/react-query';
import { formatMoney } from '@sweets/api-client';
import { Card, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { api } = useAuth();
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard.stats,
    refetchInterval: 30_000,
  });

  const tiles = [
    { label: 'Orders today', value: data?.ordersToday },
    { label: 'Revenue today', value: data && formatMoney(data.revenueToday) },
    { label: 'Orders to fulfil', value: data?.pendingOrders },
    { label: 'Low-stock items', value: data?.lowStockVariants },
    { label: 'Batches expiring in 48 h', value: data?.expiringBatches },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold">{t.value ?? '—'}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
