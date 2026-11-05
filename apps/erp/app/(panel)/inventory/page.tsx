'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { StockSummaryRow } from '@sweets/types';
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
  const waiting = useQuery({ queryKey: ['stock-alerts'], queryFn: api.shopper.stockAlerts });
  const lowStock = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: api.inventory.lowStock,
  });
  const locations = useQuery({
    queryKey: ['inventory', 'locations'],
    queryFn: api.inventory.locations,
  });

  const [form, setForm] = useState({ variantId: '', locationId: '', quantity: '' });
  const [added, setAdded] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  // Low-stock counts also show on the dashboard and the sidebar badge.
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['inventory'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);

  /** Jump from a low-stock row to the production form, pre-filled with that item. */
  function restock(r: StockSummaryRow) {
    const suggested = Math.max(1, r.lowStockThreshold * 2 - r.available);
    setForm((f) => ({ ...f, variantId: r.variantId, quantity: String(suggested) }));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => qtyRef.current?.select(), 300);
  }

  const addBatch = useMutation({
    mutationFn: () =>
      api.inventory.addBatch({
        variantId: form.variantId,
        locationId: form.locationId || locations.data![0]!.id,
        quantity: Number(form.quantity),
        source: 'PRODUCTION',
      }),
    onSuccess: (batch) => {
      const item = summary.data?.find((r) => r.variantId === form.variantId);
      setAdded(
        `Added ${batch.quantity} × ${item ? `${item.productName} (${item.variantLabel})` : 'item'}`,
      );
      setTimeout(() => setAdded(null), 4000);
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

      <LowStockPanel rows={lowStock.data} loading={lowStock.isLoading} onRestock={restock} />
      {!!waiting.data?.length && (
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="font-medium text-blue-900">Customers waiting for a restock</h2>
          <p className="mb-2 text-xs text-blue-800">
            They asked to be emailed when these sizes are back. Making a batch notifies them.
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {waiting.data.map((w) => (
              <li
                key={w.variantId}
                className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-blue-100"
              >
                {w.productName} · {w.label}{' '}
                <span className="font-semibold text-blue-800">{w.waiting} waiting</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 font-medium">Record today&apos;s production</h2>
        <form
          ref={formRef}
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
            ref={qtyRef}
            required
            type="number"
            min={1}
            placeholder="Units"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <Button disabled={addBatch.isPending || !locations.data?.length}>Add batch</Button>
          {added ? (
            <span className="text-sm font-medium text-green-700">{added} ✓</span>
          ) : (
            <span className="text-xs text-slate-500">
              Expiry is set from the product&apos;s shelf life.
            </span>
          )}
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
        <Table head={['SKU', 'Item', 'Available', 'Alert at', 'Next expiry']}>
          {summary.data?.map((r) => (
            <tr key={r.variantId}>
              <Td className="font-mono text-xs">{r.sku}</Td>
              <Td>
                {r.productName} — {r.variantLabel}
              </Td>
              <Td>
                <Badge tone={r.available === 0 ? 'red' : r.isLow ? 'amber' : 'green'}>
                  {r.available}
                </Badge>
              </Td>
              <Td className="text-xs text-slate-500">{r.lowStockThreshold}</Td>
              <Td className="text-xs text-slate-500">{fmtDate(r.nextExpiry)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

function LowStockPanel({
  rows,
  loading,
  onRestock,
}: {
  rows: StockSummaryRow[] | undefined;
  loading: boolean;
  onRestock: (r: StockSummaryRow) => void;
}) {
  if (loading || !rows) return null;
  if (!rows.length) {
    return (
      <p
        id="low-stock"
        className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-800"
      >
        ✓ Everything on sale is above its low-stock level.
      </p>
    );
  }
  const soldOut = rows.filter((r) => r.available === 0).length;
  return (
    <section id="low-stock" className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium text-amber-900">
          Low stock: {rows.length} item{rows.length > 1 ? 's' : ''}
          {soldOut > 0 && <span className="text-red-700"> ({soldOut} sold out)</span>}
        </h2>
        <p className="text-xs text-amber-800">
          Alert levels are set per pack size in the product editor.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-amber-200 bg-white">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-amber-100">
            {rows.map((r) => (
              <tr key={r.variantId}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/products/${r.productId}`}
                    className="font-medium hover:text-brand-700"
                  >
                    {r.productName}
                  </Link>{' '}
                  <span className="text-slate-500">· {r.variantLabel}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Badge tone={r.available === 0 ? 'red' : 'amber'}>
                    {r.available === 0 ? 'Sold out' : `${r.available} left`}
                  </Badge>
                </td>
                <td className="hidden px-4 py-2.5 text-xs text-slate-500 sm:table-cell">
                  alert at {r.lowStockThreshold}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button variant="secondary" onClick={() => onRestock(r)}>
                    Record production
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
