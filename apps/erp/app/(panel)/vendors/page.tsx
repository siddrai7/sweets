'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { GSTIN_PATTERN, type Vendor } from '@sweets/types';
import {
  Badge,
  Button,
  Empty,
  Field,
  Modal,
  PageHeader,
  Table,
  Td,
  inputCls,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function VendorsPage() {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const vendors = useQuery({ queryKey: ['vendors'], queryFn: api.vendors.list });
  const materials = useQuery({ queryKey: ['raw-materials'], queryFn: api.vendors.rawMaterials });
  const [editing, setEditing] = useState<Vendor | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Vendors"
        actions={isAdmin && <Button onClick={() => setEditing('new')}>+ Add vendor</Button>}
      />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Suppliers of raw materials and bought-in goods. Give a vendor a login and they can see and
        acknowledge their own purchase orders.
      </p>

      {vendors.error ? (
        <Empty>Couldn’t load vendors: {vendors.error.message}</Empty>
      ) : !vendors.data?.length ? (
        <Empty>{vendors.isLoading ? 'Loading…' : 'No vendors yet. Add your first supplier.'}</Empty>
      ) : (
        <Table head={['Vendor', 'Contact', 'GSTIN', 'Logins', 'Open POs', 'Status', '']}>
          {vendors.data.map((v) => (
            <tr key={v.id} className={v.isActive ? '' : 'bg-slate-50/60 text-slate-500'}>
              <Td>
                <div className="font-medium">{v.name}</div>
                {v.address && (
                  <div className="max-w-xs truncate text-xs text-slate-500">{v.address}</div>
                )}
              </Td>
              <Td>
                {v.contactName ?? '—'}
                <div className="text-xs text-slate-500">
                  {[v.phone, v.email].filter(Boolean).join(' · ')}
                </div>
              </Td>
              <Td className="font-mono text-xs">{v.gstin ?? '—'}</Td>
              <Td>
                {v.loginCount ? (
                  <Link href="/users?role=VENDOR" className="hover:text-brand-700">
                    {v.loginCount}
                  </Link>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </Td>
              <Td>
                {v.openPurchaseOrders ? (
                  <Link href="/purchase-orders" className="hover:text-brand-700">
                    {v.openPurchaseOrders}
                  </Link>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </Td>
              <Td>
                <Badge tone={v.isActive ? 'green' : 'slate'}>
                  {v.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap text-right">
                {isAdmin && (
                  <div className="flex justify-end gap-1.5">
                    {v.isActive && (
                      <Link
                        href={`/users?vendorLogin=${v.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                      >
                        + Login
                      </Link>
                    )}
                    <Button variant="secondary" onClick={() => setEditing(v)}>
                      Edit
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <h2 className="mb-3 mt-8 font-medium">Raw materials</h2>
      <Table head={['Material', 'In stock', 'Reorder at']}>
        {materials.data?.map((m) => (
          <tr key={m.id}>
            <Td>{m.name}</Td>
            <Td>
              <Badge tone={Number(m.currentStock) <= Number(m.reorderLevel) ? 'red' : 'green'}>
                {m.currentStock} {m.unit.toLowerCase()}
              </Badge>
            </Td>
            <Td className="text-slate-500">
              {m.reorderLevel} {m.unit.toLowerCase()}
            </Td>
          </tr>
        ))}
      </Table>

      {editing && (
        <VendorDialog
          vendor={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function VendorDialog({ vendor, onClose }: { vendor?: Vendor; onClose: () => void }) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: vendor?.name ?? '',
    contactName: vendor?.contactName ?? '',
    phone: vendor?.phone ?? '',
    email: vendor?.email ?? '',
    gstin: vendor?.gstin ?? '',
    address: vendor?.address ?? '',
    isActive: vendor?.isActive ?? true,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const gstinInvalid = !!form.gstin && !GSTIN_PATTERN.test(form.gstin);
  const deactivating = !!vendor?.isActive && !form.isActive;

  const save = useMutation({
    mutationFn: () => {
      const orNull = (s: string) => s.trim() || null;
      const payload = {
        name: form.name.trim(),
        contactName: orNull(form.contactName),
        phone: orNull(form.phone),
        email: orNull(form.email),
        gstin: orNull(form.gstin),
        address: orNull(form.address),
        isActive: form.isActive,
      };
      return vendor ? api.vendors.update(vendor.id, payload) : api.vendors.create(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
    },
  });

  return (
    <Modal
      title={vendor ? `Edit ${vendor.name}` : 'Add a vendor'}
      description={vendor ? undefined : 'A supplier you buy raw materials or finished goods from.'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            form="vendor-form"
            variant={deactivating ? 'danger' : 'primary'}
            disabled={save.isPending || gstinInvalid}
          >
            {save.isPending
              ? 'Saving…'
              : deactivating
                ? 'Save and deactivate'
                : vendor
                  ? 'Save changes'
                  : 'Add vendor'}
          </Button>
        </>
      }
    >
      <form
        id="vendor-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Business name">
          <input
            required
            autoFocus
            maxLength={150}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Shree Dairy Suppliers"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact person">
            <input
              maxLength={100}
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className={inputCls}
            />
          </Field>
          <Field label="Email" hint="For sending purchase orders.">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label="GSTIN"
            error={gstinInvalid ? 'Should look like 27ABCDE1234F1Z5' : null}
            hint="Optional. Needed for input tax credit."
          >
            <input
              maxLength={15}
              value={form.gstin}
              onChange={(e) => set('gstin', e.target.value.toUpperCase().replace(/\s/g, ''))}
              className={`${inputCls} font-mono uppercase`}
            />
          </Field>
        </div>
        <Field label="Address">
          <textarea
            rows={2}
            maxLength={500}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            className={inputCls}
          />
        </Field>
        {vendor && (
          <label className="flex cursor-pointer gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              Active
              <span className="block text-xs text-slate-500">
                Inactive vendors can’t receive new purchase orders.
              </span>
            </span>
          </label>
        )}
        {deactivating && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            {vendor?.loginCount
              ? `Their ${vendor.loginCount} login${vendor.loginCount > 1 ? 's' : ''} will be signed out and blocked until you reactivate them. `
              : ''}
            Existing purchase orders and history are kept.
          </p>
        )}
        {save.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {save.error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
