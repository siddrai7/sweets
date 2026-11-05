'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { nextActions } from '@/lib/orders';
import { formatMoney } from '@sweets/api-client';
import { ORDER_STATUSES } from '@sweets/types/constants';
import type { OrderStatus } from '@sweets/types';
import { Badge, Button, Empty, PageHeader, Table, Td, fmtDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const TONE: Partial<Record<OrderStatus, 'green' | 'amber' | 'red' | 'blue'>> = {
  PENDING_PAYMENT: 'amber',
  CONFIRMED: 'blue',
  PREPARING: 'blue',
  READY: 'blue',
  OUT_FOR_DELIVERY: 'blue',
  DELIVERED: 'green',
  CANCELLED: 'red',
  REFUNDED: 'red',
};

const label = (s: string) => s.replaceAll('_', ' ').toLowerCase();

export default function OrdersPage() {
  const { api } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status, search, page],
    queryFn: () =>
      api.orders.list({
        status: status || undefined,
        search: search || undefined,
        page,
        pageSize: 25,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });

  const update = useMutation({
    mutationFn: ({ id, to }: { id: string; to: OrderStatus }) => api.orders.updateStatus(id, to),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
    onError: (e) => alert(e.message),
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search order #, name, phone"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Empty>Loading…</Empty>
      ) : !data?.items.length ? (
        <Empty>No orders match.</Empty>
      ) : (
        <Table head={['Order', 'Customer', 'Items', 'Total', 'Status', 'Placed', 'Actions']}>
          {data.items.map((o) => (
            <tr key={o.id}>
              <Td className="font-mono text-xs">
                <Link
                  href={`/orders/${o.id}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {o.orderNumber}
                </Link>
                <div className="mt-1 font-sans text-slate-500">
                  {o.fulfillment === 'PICKUP'
                    ? 'Store pickup'
                    : o.address
                      ? `${o.address.city} ${o.address.pincode}`
                      : 'Delivery'}
                </div>
              </Td>
              <Td>
                {o.customer?.name}
                <div className="text-xs text-slate-500">
                  {o.customer?.phone ?? o.customer?.email}
                </div>
              </Td>
              <Td className="max-w-xs text-xs">
                {o.items.map((i) => (
                  <div key={i.id}>
                    {i.productName} · {i.variantLabel} × {i.quantity}
                  </div>
                ))}
              </Td>
              <Td className="font-medium">{formatMoney(o.total)}</Td>
              <Td>
                <Badge tone={TONE[o.status]}>{label(o.status)}</Badge>
              </Td>
              <Td className="text-xs text-slate-500">{fmtDate(o.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {nextActions(o.status, o.fulfillment).map(({ to, label: actionLabel }) => (
                    <Button
                      key={to}
                      variant={to === 'CANCELLED' ? 'danger' : 'secondary'}
                      disabled={update.isPending}
                      onClick={() => {
                        if (
                          to === 'CANCELLED' &&
                          !confirm(`Cancel ${o.orderNumber}? Stock will be returned.`)
                        )
                          return;
                        update.mutate({ id: o.id, to });
                      }}
                    >
                      {actionLabel}
                    </Button>
                  ))}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {data && pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </>
  );
}
