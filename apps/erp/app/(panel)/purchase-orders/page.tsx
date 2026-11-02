'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatMoney } from '@sweets/api-client';
import type { PurchaseOrderStatus, Role } from '@sweets/types';
import { Badge, Button, Empty, PageHeader, Table, Td, fmtDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** Mirrors the API's PO transition rules so we only show buttons that will succeed. */
function actionsFor(status: PurchaseOrderStatus, role: Role): PurchaseOrderStatus[] {
  if (role === 'VENDOR') return status === 'SENT' ? ['ACKNOWLEDGED'] : [];
  return (
    {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['CANCELLED'],
      ACKNOWLEDGED: ['RECEIVED', 'CANCELLED'],
      RECEIVED: [],
      CANCELLED: [],
    } satisfies Record<PurchaseOrderStatus, PurchaseOrderStatus[]>
  )[status];
}

const ACTION_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Send to vendor',
  ACKNOWLEDGED: 'Acknowledge',
  RECEIVED: 'Mark received',
  CANCELLED: 'Cancel',
};

export default function PurchaseOrdersPage() {
  const { api, user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: api.purchaseOrders.list,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      api.purchaseOrders.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
    onError: (e) => alert(e.message),
  });

  return (
    <>
      {/* PO creation form comes next: POST /purchase-orders already exists in the API. */}
      <PageHeader title="Purchase orders" />
      {isLoading ? (
        <Empty>Loading…</Empty>
      ) : !data?.length ? (
        <Empty>No purchase orders yet.</Empty>
      ) : (
        <Table head={['PO', 'Vendor', 'Items', 'Total', 'Expected', 'Status', '']}>
          {data.map((po) => (
            <tr key={po.id}>
              <Td className="font-mono text-xs">{po.poNumber}</Td>
              <Td>{po.vendor?.name}</Td>
              <Td className="text-xs">
                {po.items.map((i) => (
                  <div key={i.id}>
                    {i.description} — {i.quantity} {i.unit.toLowerCase()} @{' '}
                    {formatMoney(i.unitPrice)}
                  </div>
                ))}
              </Td>
              <Td className="font-medium">{formatMoney(po.total)}</Td>
              <Td className="text-xs">{fmtDate(po.expectedAt)}</Td>
              <Td>
                <Badge
                  tone={
                    po.status === 'RECEIVED' ? 'green' : po.status === 'CANCELLED' ? 'red' : 'blue'
                  }
                >
                  {po.status.toLowerCase()}
                </Badge>
              </Td>
              <Td>
                <div className="flex gap-1.5">
                  {user &&
                    actionsFor(po.status, user.role).map((s) => (
                      <Button
                        key={s}
                        variant={s === 'CANCELLED' ? 'danger' : 'secondary'}
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: po.id, status: s })}
                      >
                        {ACTION_LABEL[s]}
                      </Button>
                    ))}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
