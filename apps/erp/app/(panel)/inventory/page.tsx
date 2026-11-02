'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, Button, Card, Empty, PageHeader, Table, Td, fmtDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function InventoryPage() {
  const { api } = useAuth();
  const qc = useQueryClient();
  const summary = useQuery({ queryKey: ['inventory', 'summary'], queryFn: api.inventory.summary });
  const expiring = useQuery({
    queryKey: ['inventory', 'expiring'],
    queryFn: () => api.inventory.expiring(48),
  });
  const locations = useQuery({
    queryKey: ['inventory', 'locations'],
    queryFn: api.inventory.locations,
  });

  const [form, setForm] = useState({ variantId: '', locationId: '', quantity: '' });
  const refresh = () => qc.invalidateQueries({ queryKey: ['inventory'] });

  const addBatch = useMutation({
    mutationFn: () =>
      api.inventory.addBatch({
        variantId: form.variantId,
        locationId: form.locationId || locations.data![0]!.id,
        quantity: Number(form.quantity),
        source: 'PRODUCTION',
      }),
    onSuccess: () => {
      setForm({ variantId: '', locationId: form.locationId, quantity: '' });
      void refresh();
    },
    onError: (e) => alert(e.message),
  });

  const writeOff = useMutation({
    mutationFn: ({ batchId, quantity }: { batchId: string; quantity: number }) =>
      api.inventory.adjust({
        batchId,
        quantityDelta: -quantity,
        type: 'WASTAGE',
        note: 'Written off near expiry',
      }),
    onSuccess: refresh,
    onError: (e) => alert(e.message),
  });

  return (
    <>
      <PageHeader title="Inventory" />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium">Record today&apos;s production</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            addBatch.mutate();
          }}
        >
          <select
            required
            value={form.variantId}
            onChange={(e) => setForm({ ...form, variantId: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select item…</option>
            {summary.data?.map((r) => (
              <option key={r.variantId} value={r.variantId}>
                {r.productName} — {r.variantLabel}
              </option>
            ))}
          </select>
          <select
            value={form.locationId}
            onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            {locations.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min={1}
            placeholder="Units"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <Button disabled={addBatch.isPending || !locations.data?.length}>Add batch</Button>
          <span className="text-xs text-slate-500">
            Expiry is set from the product&apos;s shelf life.
          </span>
        </form>
      </Card>

      <h2 className="mb-3 font-medium">Expiring in the next 48 hours</h2>
      <div className="mb-8">
        {!expiring.data?.length ? (
          <Card>
            <Empty>Nothing expiring soon.</Empty>
          </Card>
        ) : (
          <Table head={['Item', 'Batch', 'Location', 'Units', 'Expires', '']}>
            {expiring.data.map((b) => (
              <tr key={b.id}>
                <Td>
                  {b.variant?.product.name} — {b.variant?.label}
                </Td>
                <Td className="font-mono text-xs">{b.batchCode}</Td>
                <Td>{b.location?.name}</Td>
                <Td>{b.quantity}</Td>
                <Td>
                  <Badge tone="amber">{fmtDate(b.expiresAt)}</Badge>
                </Td>
                <Td>
                  <Button
                    variant="danger"
                    disabled={writeOff.isPending}
                    onClick={() =>
                      confirm(`Write off ${b.quantity} units as wastage?`) &&
                      writeOff.mutate({ batchId: b.id, quantity: b.quantity })
                    }
                  >
                    Write off
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <h2 className="mb-3 font-medium">Stock on hand</h2>
      {summary.isLoading ? (
        <Empty>Loading…</Empty>
      ) : (
        <Table head={['SKU', 'Item', 'Available', 'Next expiry']}>
          {summary.data?.map((r) => (
            <tr key={r.variantId}>
              <Td className="font-mono text-xs">{r.sku}</Td>
              <Td>
                {r.productName} — {r.variantLabel}
              </Td>
              <Td>
                <Badge tone={r.available === 0 ? 'red' : r.available <= 5 ? 'amber' : 'green'}>
                  {r.available}
                </Badge>
              </Td>
              <Td className="text-xs text-slate-500">{fmtDate(r.nextExpiry)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
