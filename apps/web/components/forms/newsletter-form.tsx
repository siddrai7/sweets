'use client';

import { useState } from 'react';
import { browserApi } from '@/lib/browser-api';

export function NewsletterForm({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  if (state === 'done') {
    return (
      <p className={tone === 'dark' ? 'text-saffron-400' : 'text-pista-600'}>
        Thank you! You&apos;re on the list. 🎉
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState('busy');
        try {
          await browserApi.engagement.subscribe({ email });
          setState('done');
        } catch {
          setState('error');
        }
      }}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <label htmlFor={`newsletter-${tone}`} className="sr-only">
        Email address
      </label>
      <input
        id={`newsletter-${tone}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className={`input-field flex-1 ${tone === 'dark' ? 'border-white/20 bg-white/10 text-white placeholder:text-white/60' : ''}`}
      />
      <button
        disabled={state === 'busy'}
        className={
          tone === 'dark'
            ? 'btn-primary bg-saffron-500 text-cocoa hover:bg-saffron-400'
            : 'btn-primary'
        }
      >
        Subscribe
      </button>
      {state === 'error' && (
        <p className="text-sm text-red-300">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
