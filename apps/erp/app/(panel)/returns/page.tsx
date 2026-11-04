'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { ReturnStatus } from '@sweets/types';
import { Empty, PageHeader, Pagination, Tabs } from '@/components/ui';
import { ReturnCard } from '@/components/return-card';
import { useAuth } from '@/lib/auth';

const PAGE_SIZE = 20;

export default function ReturnsPage() {
  const { api } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<ReturnStatus>('REQUESTED');
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ['returns', status, page],
    queryFn: () => api.returns.list({ status, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const open = useQuery({
    queryKey: ['returns', 'open-count'],
    queryFn: () => api.returns.list({ status: 'REQUESTED', pageSize: 1 }),
  });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['returns'] }),
      qc.invalidateQueries({ queryKey: ['orders'] }),
    ]);

  return (
    <>
      <PageHeader title="Returns & refunds" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Problems customers reported within 24 hours of delivery, and refunds recorded by staff.
        Sweets aren’t restocked; approving records the refund.
      </p>
      <Tabs
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        tabs={[
          { value: 'REQUESTED', label: 'Needs review', count: open.data?.total },
          { value: 'APPROVED', label: 'Refunded' },
          { value: 'REJECTED', label: 'Rejected' },
        ]}
      />
      {list.error ? (
        <Empty>Couldn’t load: {list.error.message}</Empty>
      ) : !list.data?.items.length ? (
        <Empty>
          {list.isLoading
            ? 'Loading…'
            : status === 'REQUESTED'
              ? 'Nothing waiting. 🎉'
              : 'Nothing here yet.'}
        </Empty>
      ) : (
        <>
          <ul className="grid gap-3 lg:grid-cols-2">
            {list.data.items.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <Link
                    href={`/orders/${r.order!.id}`}
                    className="font-mono text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {r.order!.orderNumber}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {r.order!.customer.name}
                    {r.order!.customer.phone && ` · ${r.order!.customer.phone}`} · order{' '}
                    {formatMoney(r.order!.total)}
                  </span>
                </div>
                <ul>
                  <ReturnCard request={r} refundable={Number(r.order!.total)} onDone={refresh} />
                </ul>
                {r.status === 'REQUESTED' && (
                  <Link
                    href={`/orders/${r.order!.id}`}
                    className="mt-2 inline-block text-xs text-slate-500 hover:text-brand-700"
                  >
                    See items and order history →
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
