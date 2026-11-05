'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import { REFUND_METHODS } from '@sweets/types/constants';
import type { Order, RefundMethod, ReturnRequest } from '@sweets/types';
import { Badge, Button, Field, fmtDate, inputCls } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { REFUND_METHOD_LABEL, RETURN_REASON_LABEL, statusLabel } from '@/lib/orders';

const RETURN_TONE = { REQUESTED: 'amber', APPROVED: 'green', REJECTED: 'slate' } as const;

function itemSummary(order: Order, r: ReturnRequest) {
  return r.items
    .map((x) => {
      const line = order.items.find((i) => i.id === x.orderItemId);
      return line ? `${line.productName} ${line.variantLabel} × ${x.quantity}` : null;
    })
    .filter(Boolean)
    .join(', ');
}

/** One problem report or refund, with approve / reject while it's open. */
export function ReturnCard({
  request: r,
  order,
  refundable,
  onDone,
}: {
  request: ReturnRequest;
  /** Full order, for item names; omit on lists that don't load items. */
  order?: Order;
  refundable: number;
  onDone: () => void;
}) {
  const { api } = useAuth();
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const [amount, setAmount] = useState(String(Math.min(Number(r.requestedAmount), refundable)));
  const [method, setMethod] = useState<RefundMethod>('UPI');
  const [note, setNote] = useState('');
  const act = useMutation({
    mutationFn: () =>
      mode === 'approve'
        ? api.returns.approve(r.id, {
            refundAmount: amount,
            refundMethod: method,
            note: note || undefined,
          })
        : api.returns.reject(r.id, note),
    onSuccess: () => {
      setMode(null);
      onDone();
    },
  });

  return (
    <li className="rounded-lg border border-slate-200 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {RETURN_REASON_LABEL[r.reason]} · {formatMoney(r.requestedAmount)}
        </span>
        <Badge tone={RETURN_TONE[r.status]}>
          {r.status === 'REQUESTED' ? 'Needs review' : statusLabel(r.status)}
        </Badge>
      </div>
      {order && r.items.length > 0 && <p className="text-slate-600">{itemSummary(order, r)}</p>}
      {r.note && <p className="mt-1 italic text-slate-600">“{r.note}”</p>}
      <p className="mt-1 text-xs text-slate-500">
        {r.createdBy?.role === 'CUSTOMER'
          ? 'Reported by customer'
          : `Recorded by ${r.createdBy?.name}`}{' '}
        · {fmtDate(r.createdAt)}
      </p>
      {r.status === 'APPROVED' && (
        <p className="mt-2 rounded bg-green-50 px-2 py-1 text-green-800">
          Refunded {formatMoney(r.refundAmount!)} by{' '}
          {REFUND_METHOD_LABEL[r.refundMethod!].toLowerCase()}
          {r.resolvedBy && ` · ${r.resolvedBy.name}`}
          {r.resolutionNote && ` · ${r.resolutionNote}`}
        </p>
      )}
      {r.status === 'REJECTED' && (
        <p className="mt-2 rounded bg-slate-100 px-2 py-1 text-slate-700">
          Rejected{r.resolvedBy && ` by ${r.resolvedBy.name}`}: {r.resolutionNote}
        </p>
      )}

      {r.status === 'REQUESTED' && !mode && (
        <div className="mt-2 flex gap-2">
          <Button onClick={() => setMode('approve')}>Approve refund</Button>
          <Button variant="secondary" onClick={() => setMode('reject')}>
            Reject
          </Button>
        </div>
      )}
      {mode && (
        <form
          className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate();
          }}
        >
          {mode === 'approve' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Refund ₹" hint={`Up to ${formatMoney(refundable)}`}>
                <input
                  required
                  type="number"
                  min={1}
                  max={refundable}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Paid back by">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as RefundMethod)}
                  className={inputCls}
                >
                  {REFUND_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {REFUND_METHOD_LABEL[m]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <Field
            label={
              mode === 'approve'
                ? 'Note for the customer (optional)'
                : 'Reason (shown to the customer)'
            }
          >
            <input
              required={mode === 'reject'}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === 'approve' ? 'e.g. Sent to their UPI ID' : ''}
              className={inputCls}
            />
          </Field>
          {act.error && <p className="text-sm text-red-700">{act.error.message}</p>}
          <div className="flex gap-2">
            <Button variant={mode === 'reject' ? 'danger' : 'primary'} disabled={act.isPending}>
              {mode === 'approve' ? 'Confirm refund' : 'Reject request'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
