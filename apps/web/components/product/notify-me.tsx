'use client';

import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { BellIcon, CheckIcon } from '@/components/ui/icons';
import { browserApi } from '@/lib/browser-api';
import { useSession } from '@/lib/session';

/** Shown for a sold-out size: email me when it's back. */
export function NotifyMe({ variantId, label }: { variantId: string; label: string }) {
  const { user } = useSession();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    setError(null);
    try {
      await browserApi.shopper.notifyWhenBack(variantId, user?.email ?? email);
      setState('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save that. Please try again.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <p
        className="flex items-center gap-2 rounded-2xl bg-pista-50 p-4 text-sm font-semibold text-pista-700 ring-1 ring-pista-100"
        role="status"
      >
        <CheckIcon size={18} /> We’ll email you as soon as the {label} is back.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-saffron-50 p-4 ring-1 ring-saffron-100">
      <p className="flex items-center gap-2 text-sm font-bold">
        <BellIcon size={18} className="text-saffron-600" /> Sold out for today
      </p>
      <p className="mt-1 text-sm text-cocoa-soft">
        We make fresh batches daily. Get an email when it’s back.
      </p>
      <div className="mt-3 flex gap-2">
        {!user && (
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            aria-label="Your email"
            className="input-field flex-1"
          />
        )}
        <button
          disabled={state === 'busy'}
          className="btn-primary whitespace-nowrap rounded-xl px-5"
        >
          {state === 'busy' ? 'Saving…' : 'Notify me'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
    </form>
  );
}
