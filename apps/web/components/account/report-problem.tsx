'use client';

import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { RETURN_REASONS } from '@sweets/types/constants';
import type { Order, ReturnReason } from '@sweets/types';
import { ProductImage } from '@/components/product/product-image';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/lib/session';
import { slugify } from './order-status';

export const REASON_LABEL: Record<ReturnReason, string> = {
  DAMAGED: 'Arrived damaged',
  WRONG_ITEM: 'Wrong item',
  MISSING_ITEM: 'Item missing',
  QUALITY: 'Not fresh / quality issue',
  OTHER: 'Something else',
};

/** Units of each line not already covered by an open or approved report. */
export function reportableQuantities(order: Order) {
  const claimed = new Map<string, number>();
  for (const r of order.returns ?? []) {
    if (r.status === 'REJECTED') continue;
    for (const i of r.items)
      claimed.set(i.orderItemId, (claimed.get(i.orderItemId) ?? 0) + i.quantity);
  }
  return new Map(order.items.map((i) => [i.id, i.quantity - (claimed.get(i.id) ?? 0)]));
}

export function ReportProblemSheet({
  order,
  onClose,
  onDone,
}: {
  order: Order;
  onClose: () => void;
  onDone: (o: Order) => void;
}) {
  const { api } = useSession();
  const left = reportableQuantities(order);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = Object.entries(qty).filter(([, n]) => n > 0);
  const value = chosen.reduce((sum, [id, n]) => {
    const line = order.items.find((i) => i.id === id);
    return sum + (line ? Number(line.unitPrice) * n : 0);
  }, 0);

  async function submit() {
    if (!reason) return setError('Tell us what went wrong.');
    if (!chosen.length) return setError('Choose the items with a problem.');
    setBusy(true);
    setError(null);
    try {
      await api.orders.requestReturn(order.orderNumber, {
        reason,
        items: chosen.map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
        note: note.trim() || undefined,
      });
      onDone(await api.orders.get(order.orderNumber));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t send your report. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Report a problem"
      footer={
        <button onClick={submit} disabled={busy} className="btn-primary w-full py-3.5">
          {busy ? 'Sending…' : value > 0 ? `Send report · ${formatMoney(value)}` : 'Send report'}
        </button>
      }
    >
      <p className="mb-4 text-sm text-cocoa-soft">
        Sorry something wasn’t right. Our sweets are fresh and can’t be returned, but we’ll make it
        right with a refund for anything damaged, missing or not up to standard.
      </p>
      <h3 className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cocoa-soft">
        Which items?
      </h3>
      <ul className="space-y-2">
        {order.items.map((i) => {
          const max = left.get(i.id) ?? 0;
          const n = qty[i.id] ?? 0;
          return (
            <li
              key={i.id}
              className={`flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ${n ? 'ring-cocoa' : 'ring-brand-200'} ${max ? '' : 'opacity-50'}`}
            >
              <ProductImage
                name={i.productName}
                slug={slugify(i.productName)}
                sizes="44px"
                className="h-11 w-11 shrink-0 rounded-xl"
              />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-semibold">{i.productName}</span>
                <span className="text-xs text-cocoa-soft">
                  {i.variantLabel} · {max ? `${max} of ${i.quantity}` : 'already reported'}
                </span>
              </span>
              {max > 0 && (
                <span className="flex h-9 items-center rounded-xl ring-1 ring-brand-200">
                  <button
                    type="button"
                    aria-label="Fewer"
                    onClick={() => setQty((q) => ({ ...q, [i.id]: Math.max(0, n - 1) }))}
                    className="flex h-full w-8 items-center justify-center text-cocoa-soft disabled:opacity-30"
                    disabled={!n}
                  >
                    <MinusIcon size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold tabular-nums">{n}</span>
                  <button
                    type="button"
                    aria-label="More"
                    onClick={() => setQty((q) => ({ ...q, [i.id]: Math.min(max, n + 1) }))}
                    className="flex h-full w-8 items-center justify-center text-cocoa-soft disabled:opacity-30"
                    disabled={n >= max}
                  >
                    <PlusIcon size={14} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="mb-2 mt-5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cocoa-soft">
        What happened?
      </h3>
      <div className="flex flex-wrap gap-2">
        {RETURN_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            aria-pressed={reason === r}
            className={`chip ${reason === r ? 'chip-active' : ''}`}
          >
            {REASON_LABEL[r]}
          </button>
        ))}
      </div>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">
          Tell us more (optional)
        </span>
        <textarea
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. The box was crushed and the katli pieces were broken."
          className="input-field"
        />
      </label>
      {error && (
        <p className="mt-3 rounded-xl bg-brand-100 px-3 py-2.5 text-sm text-brand-700" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}
