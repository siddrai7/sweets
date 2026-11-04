'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { MAX_SAVED_ADDRESSES, type AddressInput, type SavedAddress } from '@sweets/types';
import { AccountHeader } from '@/components/account/account-nav';
import {
  AddressFields,
  addressLines,
  emptyAddress,
  toAddressInput,
} from '@/components/account/address-fields';
import { PinIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { useSession } from '@/lib/session';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddressesPage() {
  const router = useRouter();
  const { user, ready, api } = useSession();
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null);

  const load = useCallback(() => api.account.addresses().then(setAddresses), [api]);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login?next=/account/addresses');
    else void load();
  }, [ready, user, router, load]);

  async function remove(a: SavedAddress) {
    if (!window.confirm(`Remove ${a.label ?? 'this address'}?`)) return;
    await api.account.deleteAddress(a.id);
    await load();
  }

  async function makeDefault(a: SavedAddress) {
    await api.account.updateAddress(a.id, { isDefault: true });
    await load();
  }

  const full = (addresses?.length ?? 0) >= MAX_SAVED_ADDRESSES;

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <AccountHeader title="Addresses" />

      <div className="mt-8 space-y-3">
        {!addresses &&
          [0, 1].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-white ring-1 ring-brand-200"
            />
          ))}

        {addresses?.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-brand-300 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <PinIcon size={26} />
            </span>
            <p className="mt-4 font-display text-2xl">No saved addresses</p>
            <p className="mt-1 max-w-xs text-sm text-cocoa-soft">
              Save one here, or tick “Save this address” at checkout, for faster ordering.
            </p>
          </div>
        )}

        {addresses?.map((a) => (
          <article
            key={a.id}
            className={`rounded-3xl bg-white p-5 ring-1 ${a.isDefault ? 'ring-cocoa' : 'ring-brand-200'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 text-sm">
                <p className="flex items-center gap-2 font-bold">
                  {a.label ?? 'Address'}
                  {a.isDefault && (
                    <span className="rounded bg-cocoa px-1.5 py-0.5 text-[0.62rem] uppercase tracking-wider text-white">
                      Default
                    </span>
                  )}
                </p>
                <p className="mt-1 font-semibold">{a.name}</p>
                <p className="text-cocoa-soft">{addressLines(a)}</p>
                <p className="text-cocoa-soft">{a.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {!a.isDefault && (
                  <button onClick={() => makeDefault(a)} className="text-brand-600 hover:underline">
                    Set as default
                  </button>
                )}
                <button onClick={() => setEditing(a)} className="hover:text-brand-600">
                  Edit
                </button>
                <button onClick={() => remove(a)} className="text-cocoa-soft hover:text-brand-600">
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}

        {addresses && (
          <button
            onClick={() => setEditing('new')}
            disabled={full}
            className="w-full rounded-3xl border border-dashed border-brand-300 p-5 text-sm font-bold text-brand-600 transition hover:border-cocoa/40 disabled:opacity-50"
          >
            {full ? `You can save up to ${MAX_SAVED_ADDRESSES} addresses` : '+ Add a new address'}
          </button>
        )}
      </div>

      {editing && (
        <AddressSheet
          address={editing === 'new' ? undefined : editing}
          defaults={{ name: user?.name ?? '', phone: user?.phone ?? '' }}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function AddressSheet({
  address,
  defaults,
  onClose,
  onSaved,
}: {
  address?: SavedAddress;
  defaults: { name: string; phone: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { api } = useSession();
  const [value, setValue] = useState<AddressInput>(
    address ? toAddressInput(address) : { ...emptyAddress, ...defaults },
  );
  const [label, setLabel] = useState(address?.label ?? 'Home');
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = { ...value, line2: value.line2 || null, label: label.trim() || null };
    try {
      if (address) await api.account.updateAddress(address.id, { ...payload, isDefault });
      else await api.account.createAddress({ ...payload, isDefault });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save the address.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={address ? 'Edit address' : 'New address'}
      footer={
        <button form="address-form" disabled={busy} className="btn-primary w-full py-3.5">
          {busy ? 'Saving…' : 'Save address'}
        </button>
      }
    >
      <form id="address-form" onSubmit={save} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">Save as</span>
          <div className="flex flex-wrap gap-2">
            {LABELS.map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLabel(l)}
                aria-pressed={label === l}
                className={`chip ${label === l ? 'chip-active' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <AddressFields value={value} onChange={setValue} />
        {!address?.isDefault && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Use as my default address
          </label>
        )}
        {error && (
          <p className="rounded-xl bg-brand-100 px-3 py-2.5 text-sm text-brand-700" role="alert">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}
