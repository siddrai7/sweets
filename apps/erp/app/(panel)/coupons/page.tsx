'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { Coupon, CouponInput, CouponType } from '@sweets/types';
import {
  Badge,
  Button,
  Empty,
  Field,
  Modal,
  PageHeader,
  Table,
  Td,
  fmtDate,
  inputCls,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENT: '% off',
  FLAT: '₹ off',
  FREE_DELIVERY: 'Free delivery',
};

function describe(c: Coupon) {
  const off =
    c.type === 'PERCENT'
      ? `${Number(c.value)}% off${c.maxDiscount ? ` (max ${formatMoney(c.maxDiscount)})` : ''}`
      : c.type === 'FLAT'
        ? `${formatMoney(c.value)} off`
        : 'Free delivery';
  return Number(c.minSubtotal) > 0 ? `${off} above ${formatMoney(c.minSubtotal)}` : off;
}

function status(c: Coupon): { label: string; tone: 'green' | 'slate' | 'amber' | 'red' } {
  const now = Date.now();
  if (!c.isActive) return { label: 'Paused', tone: 'slate' };
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return { label: 'Expired', tone: 'red' };
  if (c.startsAt && new Date(c.startsAt).getTime() > now)
    return { label: 'Scheduled', tone: 'amber' };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit)
    return { label: 'Used up', tone: 'red' };
  return { label: 'Live', tone: 'green' };
}

export default function CouponsPage() {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: api.coupons.list });
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Coupons"
        actions={isAdmin && <Button onClick={() => setEditing('new')}>+ New coupon</Button>}
      />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-500">
        Codes customers enter at checkout. Discounts come off the GST-inclusive price, so the GST on
        the invoice goes down with it.
      </p>
      {coupons.error ? (
        <Empty>Couldn’t load coupons: {coupons.error.message}</Empty>
      ) : !coupons.data?.length ? (
        <Empty>{coupons.isLoading ? 'Loading…' : 'No coupons yet.'}</Empty>
      ) : (
        <Table head={['Code', 'Offer', 'Valid', 'Used', 'Status', '']}>
          {coupons.data.map((c) => {
            const st = status(c);
            return (
              <tr key={c.id}>
                <Td>
                  <span className="font-mono font-semibold">{c.code}</span>
                  {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
                </Td>
                <Td>
                  {describe(c)}
                  <div className="text-xs text-slate-500">
                    {[
                      c.firstOrderOnly && 'First order only',
                      c.perCustomerLimit && `${c.perCustomerLimit}× per customer`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-xs text-slate-600">
                  {c.startsAt || c.endsAt
                    ? `${c.startsAt ? fmtDate(c.startsAt) : 'Now'} – ${c.endsAt ? fmtDate(c.endsAt) : 'no end'}`
                    : 'Always'}
                </Td>
                <Td>
                  {c.usedCount}
                  {c.usageLimit !== null && (
                    <span className="text-slate-400"> / {c.usageLimit}</span>
                  )}
                </Td>
                <Td>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Td>
                <Td className="text-right">
                  {isAdmin && (
                    <Button variant="secondary" onClick={() => setEditing(c)}>
                      Edit
                    </Button>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
      {editing && (
        <CouponDialog
          coupon={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

const toLocal = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

function CouponDialog({ coupon, onClose }: { coupon?: Coupon; onClose: () => void }) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({
    code: coupon?.code ?? '',
    description: coupon?.description ?? '',
    type: (coupon?.type ?? 'PERCENT') as CouponType,
    value: coupon ? String(Number(coupon.value)) : '10',
    maxDiscount: coupon?.maxDiscount ? String(Number(coupon.maxDiscount)) : '',
    minSubtotal: coupon ? String(Number(coupon.minSubtotal)) : '0',
    startsAt: toLocal(coupon?.startsAt ?? null),
    endsAt: toLocal(coupon?.endsAt ?? null),
    usageLimit: coupon?.usageLimit?.toString() ?? '',
    perCustomerLimit: coupon ? (coupon.perCustomerLimit?.toString() ?? '') : '1',
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    isActive: coupon?.isActive ?? true,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const intOrNull = (s: string) => (s.trim() ? Number(s) : null);

  const save = useMutation({
    mutationFn: () => {
      const payload: CouponInput = {
        code: f.code,
        description: f.description.trim() || null,
        type: f.type,
        value: f.type === 'FREE_DELIVERY' ? '0' : f.value || '0',
        maxDiscount: f.type === 'PERCENT' && f.maxDiscount ? f.maxDiscount : null,
        minSubtotal: f.minSubtotal || '0',
        // Dates are whole days in IST: from the start of the first to the end of the last.
        startsAt: f.startsAt ? new Date(`${f.startsAt}T00:00:00+05:30`) : null,
        endsAt: f.endsAt ? new Date(`${f.endsAt}T23:59:59+05:30`) : null,
        usageLimit: intOrNull(f.usageLimit),
        perCustomerLimit: intOrNull(f.perCustomerLimit),
        firstOrderOnly: f.firstOrderOnly,
        isActive: f.isActive,
      };
      return coupon ? api.coupons.update(coupon.id, payload) : api.coupons.create(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['coupons'] });
      onClose();
    },
  });

  return (
    <Modal
      title={coupon ? `Edit ${coupon.code}` : 'New coupon'}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="coupon-form" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : coupon ? 'Save changes' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <form
        id="coupon-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" hint="Letters and numbers, e.g. DIWALI10.">
            <input
              required
              autoFocus
              maxLength={20}
              value={f.code}
              onChange={(e) =>
                set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
              }
              className={`${inputCls} font-mono uppercase`}
            />
          </Field>
          <Field label="Type">
            <select
              value={f.type}
              onChange={(e) => set('type', e.target.value as CouponType)}
              className={inputCls}
            >
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          {f.type !== 'FREE_DELIVERY' && (
            <Field label={f.type === 'PERCENT' ? 'Percent off' : 'Rupees off'}>
              <input
                required
                type="number"
                min={1}
                max={f.type === 'PERCENT' ? 100 : undefined}
                step="0.01"
                value={f.value}
                onChange={(e) => set('value', e.target.value)}
                className={inputCls}
              />
            </Field>
          )}
          {f.type === 'PERCENT' && (
            <Field label="Maximum discount (₹)" hint="Optional cap.">
              <input
                type="number"
                min={1}
                value={f.maxDiscount}
                onChange={(e) => set('maxDiscount', e.target.value)}
                className={inputCls}
              />
            </Field>
          )}
          <Field label="Minimum order (₹)">
            <input
              type="number"
              min={0}
              value={f.minSubtotal}
              onChange={(e) => set('minSubtotal', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Shown to customers" hint="e.g. Diwali special">
            <input
              maxLength={200}
              value={f.description}
              onChange={(e) => set('description', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Starts">
            <input
              type="date"
              value={f.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Ends" hint="Last day it works.">
            <input
              type="date"
              value={f.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Total uses" hint="Empty = unlimited.">
            <input
              type="number"
              min={1}
              value={f.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Uses per customer" hint="Empty = unlimited.">
            <input
              type="number"
              min={1}
              value={f.perCustomerLimit}
              onChange={(e) => set('perCustomerLimit', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <label className="flex cursor-pointer gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={f.firstOrderOnly}
            onChange={(e) => set('firstOrderOnly', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          First order only
        </label>
        <label className="flex cursor-pointer gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          Active
        </label>
        {save.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {save.error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
