'use client';

import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { BoltIcon, ChevronDown, PinIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { usePincode } from '@/lib/pincode';
import { site } from '@/lib/site';

/** "Delivery in 60–90 min · 413102 Baramati ▾" — opens a sheet to check another pincode. */
export function DeliveryBadge({ className = '' }: { className?: string }) {
  const { current } = usePincode();
  const [open, setOpen] = useState(false);
  const notServed = current && !current.serviceable;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group flex items-center gap-2.5 rounded-2xl text-left transition ${className}`}
        aria-haspopup="dialog"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notServed ? 'bg-brand-100 text-brand-600' : 'bg-saffron-100 text-saffron-600'}`}
        >
          {current ? <PinIcon size={18} /> : <BoltIcon size={18} />}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold tracking-tight">
            {notServed ? 'Store pickup only' : `Delivery in ${site.delivery.eta}`}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-cocoa-soft">
            {current
              ? `${current.pincode}${current.label ? ` · ${current.label}` : ''}`
              : 'Check your pincode'}
            <ChevronDown size={12} className="transition group-hover:translate-y-0.5" />
          </span>
        </span>
      </button>
      {open && <PincodeSheet onClose={() => setOpen(false)} />}
    </>
  );
}

export function PincodeSheet({ onClose }: { onClose: () => void }) {
  const { current, check } = usePincode();
  const [value, setValue] = useState(current?.pincode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState(current);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(value)) return setError('Enter a 6-digit pincode');
    setBusy(true);
    setError(null);
    try {
      setResult(await check(value));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Couldn’t check right now. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title="Where should we deliver?">
      <form onSubmit={submit} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Pincode</span>
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit pincode"
            className="input-field text-base tracking-widest"
          />
        </label>
        <button disabled={busy} className="btn-primary rounded-xl px-5">
          {busy ? 'Checking…' : 'Check'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-brand-600">{error}</p>}
      {result && !error && (
        <div
          className={`mt-4 rounded-2xl p-4 text-sm ring-1 ${result.serviceable ? 'bg-pista-50 ring-pista-100' : 'bg-brand-100/60 ring-brand-200'}`}
          role="status"
        >
          {result.serviceable ? (
            <>
              <p className="font-bold text-pista-700">
                Great, we deliver to {result.pincode}
                {result.label ? ` (${result.label})` : ''}!
              </p>
              <p className="mt-1 text-cocoa-soft">
                Delivered fresh in {site.delivery.eta}. Pick a time slot at checkout.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-brand-700">We don’t deliver to {result.pincode} yet</p>
              <p className="mt-1 text-cocoa-soft">
                You can still order for store pickup from {site.contact.address}.
              </p>
            </>
          )}
          <button onClick={onClose} className="mt-3 text-sm font-bold text-brand-600">
            Continue shopping →
          </button>
        </div>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-cocoa-soft">
        <PinIcon size={14} /> We deliver across {site.delivery.area}.
      </p>
    </Sheet>
  );
}
