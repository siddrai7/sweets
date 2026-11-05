'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import { REFUND_METHODS, RETURN_REASONS } from '@sweets/types/constants';
import type { Order, OrderStatus, RefundMethod, ReturnReason, ReturnRequest } from '@sweets/types';
import { Badge, Button, Card, Empty, Field, Modal, fmtDate, inputCls } from '@/components/ui';
import { ReturnCard } from '@/components/return-card';
import { useAuth } from '@/lib/auth';
import {
  REFUND_METHOD_LABEL,
  RETURN_REASON_LABEL,
  STATUS_TONE,
  nextActions,
  openDocument,
  statusLabel,
} from '@/lib/orders';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const qc = useQueryClient();
  const [refunding, setRefunding] = useState(false);
  const order = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.orders.get(id),
    refetchInterval: 20_000,
  });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['orders'] }),
      qc.invalidateQueries({ queryKey: ['returns'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);

  const move = useMutation({
    mutationFn: (to: OrderStatus) => api.orders.updateStatus(id, to),
    onSuccess: refresh,
    onError: (e) => alert(e.message),
  });

  if (order.error) return <Empty>Couldn’t load this order: {order.error.message}</Empty>;
  if (!order.data) return <Empty>Loading…</Empty>;
  const o = order.data;
  const a = o.address;
  const payment = o.payments?.[0];
  const refunded = (o.returns ?? [])
    .filter((r) => r.status === 'APPROVED')
    .reduce((n, r) => n + Number(r.refundAmount ?? 0), 0);
  const refundable = Number(o.total) - refunded;
  const phone = a?.phone ?? o.customer?.phone;
  const invoiceReady = !!o.invoiceNumber || o.status === 'DELIVERED' || o.status === 'REFUNDED';

  return (
    <>
      <Link href="/orders" className="no-print text-sm text-slate-500 hover:text-slate-800">
        ← Orders
      </Link>

      <div className="mb-6 mt-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold">
            <span className="font-mono">{o.orderNumber}</span>
            <Badge tone={STATUS_TONE[o.status]}>{statusLabel(o.status)}</Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Placed {fmtDate(o.createdAt)} ·{' '}
            {o.fulfillment === 'PICKUP' ? 'Store pickup' : 'Home delivery'} ·{' '}
            {o.channel.toLowerCase()}
            {o.invoiceNumber && <> · Invoice {o.invoiceNumber}</>}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          {nextActions(o.status, o.fulfillment).map(({ to, label }) => (
            <Button
              key={to}
              variant={to === 'CANCELLED' ? 'danger' : 'primary'}
              disabled={move.isPending}
              onClick={() =>
                (to !== 'CANCELLED' ||
                  confirm(`Cancel ${o.orderNumber}? Stock will be returned.`)) &&
                move.mutate(to)
              }
            >
              {label}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => window.print()}>
            Print packing slip
          </Button>
          {invoiceReady && (
            <Button
              variant="secondary"
              onClick={() => openDocument(() => api.orders.invoiceHtml(o.id))}
            >
              Invoice ↗
            </Button>
          )}
          {o.status === 'DELIVERED' && refundable > 0 && (
            <Button variant="secondary" onClick={() => setRefunding(true)}>
              Record refund
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Customer
          </h2>
          <p className="font-medium">{o.customer?.name}</p>
          {phone && (
            <p className="mt-1 flex flex-wrap gap-3 text-sm">
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="text-brand-700 hover:underline"
              >
                📞 {phone}
              </a>
              <a
                href={`https://wa.me/${phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`}
                target="_blank"
                rel="noreferrer"
                className="no-print text-brand-700 hover:underline"
              >
                WhatsApp
              </a>
            </p>
          )}
          {o.customer?.email && <p className="text-sm text-slate-500">{o.customer.email}</p>}
        </Card>

        <Card>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {o.fulfillment === 'PICKUP' ? 'Pickup' : 'Deliver to'}
          </h2>
          {o.fulfillment === 'DELIVERY' && a ? (
            <>
              <p className="font-medium">{a.name}</p>
              <p className="text-sm text-slate-600">
                {[a.line1, a.line2].filter(Boolean).join(', ')}
                <br />
                {a.city}, {a.state} {a.pincode}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', '),
                )}`}
                target="_blank"
                rel="noreferrer"
                className="no-print mt-1 inline-block text-sm text-brand-700 hover:underline"
              >
                Open in Maps ↗
              </a>
            </>
          ) : (
            <p className="text-sm text-slate-600">Customer collects from the shop.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Payment
          </h2>
          <p className="font-medium">
            {!payment || payment.provider === 'COD'
              ? o.fulfillment === 'PICKUP'
                ? 'Pay at store'
                : 'Cash on delivery'
              : payment.provider}
          </p>
          <p className="text-sm text-slate-600">
            {payment?.status === 'SUCCEEDED'
              ? `Collected ${formatMoney(o.total)}`
              : o.status === 'CANCELLED'
                ? 'Nothing to collect'
                : `Collect ${formatMoney(o.total)}`}
          </p>
          {refunded > 0 && (
            <p className="mt-1 text-sm font-medium text-red-700">
              Refunded {formatMoney(refunded)}
            </p>
          )}
        </Card>
      </div>

      {o.isGift && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            🎁 Gift order{o.giftWrap ? ' · gift wrap' : ''}
          </h2>
          {o.giftMessage ? (
            <p className="mt-2 whitespace-pre-line font-serif text-lg italic">“{o.giftMessage}”</p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No card message.</p>
          )}
          <p className="no-print mt-2 text-xs text-amber-800">
            Prices are left off the printed packing slip. Write the message on a card.
          </p>
        </Card>
      )}

      <Card className="mt-4">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium">HSN</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              <th className={`pb-2 text-right font-medium${o.isGift ? ' print:hidden' : ''}`}>
                Price
              </th>
              <th className={`pb-2 text-right font-medium${o.isGift ? ' print:hidden' : ''}`}>
                GST
              </th>
              <th className={`pb-2 text-right font-medium${o.isGift ? ' print:hidden' : ''}`}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {o.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2">
                  <span className="font-medium">{i.productName}</span>{' '}
                  <span className="text-slate-500">· {i.variantLabel}</span>
                </td>
                <td className="py-2 font-mono text-xs">{i.sku}</td>
                <td className="py-2 text-xs">{i.hsnCode ?? '—'}</td>
                <td className="py-2 text-right text-base font-semibold">{i.quantity}</td>
                <td className={`py-2 text-right${o.isGift ? ' print:hidden' : ''}`}>
                  {formatMoney(i.unitPrice)}
                </td>
                <td className={`py-2 text-right text-xs${o.isGift ? ' print:hidden' : ''}`}>
                  {Number(i.taxRatePercent)}%
                </td>
                <td className={`py-2 text-right${o.isGift ? ' print:hidden' : ''}`}>
                  {formatMoney(i.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl
          className={`ml-auto mt-3 w-64 space-y-1 border-t border-slate-200 pt-3 text-sm${o.isGift ? ' print:hidden' : ''}`}
        >
          <Row label="Subtotal" value={formatMoney(o.subtotal)} />
          {Number(o.discountTotal) > 0 && (
            <Row
              label={o.couponCode ? `Coupon ${o.couponCode}` : 'Discount'}
              value={`− ${formatMoney(o.discountTotal)}`}
            />
          )}
          <Row
            label="Delivery"
            value={Number(o.deliveryFee) ? formatMoney(o.deliveryFee) : 'Free'}
          />
          <Row label="Total" value={formatMoney(o.total)} strong />
          <Row label="incl. GST" value={formatMoney(o.taxTotal)} muted />
        </dl>
        {o.notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">Note: {o.notes}</p>}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="no-print">
          <h2 className="mb-3 font-medium">Problems & refunds</h2>
          {!o.returns?.length ? (
            <p className="text-sm text-slate-500">
              None. Customers can report a problem from their order page for 24 hours after
              delivery.
            </p>
          ) : (
            <ul className="space-y-3">
              {o.returns.map((r) => (
                <ReturnCard
                  key={r.id}
                  request={r}
                  order={o}
                  refundable={refundable}
                  onDone={refresh}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Timeline</h2>
          <ol className="space-y-3 border-l border-slate-200 pl-4 text-sm">
            {o.statusHistory?.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-brand-600" />
                <span className="font-medium">{statusLabel(e.status)}</span>{' '}
                <span className="text-slate-500">
                  · {fmtDate(e.createdAt)}
                  {e.changedBy &&
                    ` · ${e.changedBy.role === 'CUSTOMER' ? 'customer' : e.changedBy.name}`}
                </span>
                {e.note && <div className="text-xs text-slate-500">{e.note}</div>}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {refunding && (
        <RefundDialog
          order={o}
          refundable={refundable}
          onClose={() => setRefunding(false)}
          onDone={refresh}
        />
      )}
    </>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? 'font-semibold' : ''} ${muted ? 'text-xs text-slate-500' : ''}`}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RefundDialog({
  order,
  refundable,
  onClose,
  onDone,
}: {
  order: Order;
  refundable: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const { api } = useAuth();
  const [reason, setReason] = useState<ReturnReason>('DAMAGED');
  const [amount, setAmount] = useState(String(refundable));
  const [method, setMethod] = useState<RefundMethod>('UPI');
  const [note, setNote] = useState('');
  const save = useMutation({
    mutationFn: () =>
      api.orders.refund(order.id, {
        reason,
        refundAmount: amount,
        refundMethod: method,
        note: note || undefined,
      }),
    onSuccess: () => {
      onDone();
      onClose();
    },
  });

  return (
    <Modal
      title={`Record a refund for ${order.orderNumber}`}
      description="For refunds agreed outside the website, e.g. over the phone. The customer sees it on their order."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="refund-form" disabled={save.isPending}>
            Record refund
          </Button>
        </>
      }
    >
      <form
        id="refund-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Reason">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              className={inputCls}
            >
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {RETURN_REASON_LABEL[r]}
                </option>
              ))}
            </select>
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
        <Field
          label="Amount ₹"
          hint={`Up to ${formatMoney(refundable)}. Refunding it all marks the order Refunded.`}
        >
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
        <Field label="Note for the customer (optional)">
          <input
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
          />
        </Field>
        {save.error && <p className="text-sm text-red-700">{save.error.message}</p>}
      </form>
    </Modal>
  );
}
