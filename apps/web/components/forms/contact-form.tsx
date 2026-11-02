'use client';

import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import type { ContactMessageInput } from '@sweets/types';
import { browserApi } from '@/lib/browser-api';

const SUBJECTS = ['Order enquiry', 'Bulk / corporate order', 'Feedback', 'Something else'];

export function ContactForm() {
  const [form, setForm] = useState<ContactMessageInput>({
    name: '',
    email: '',
    phone: '',
    subject: SUBJECTS[0],
    message: '',
  });
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (state === 'done') {
    return (
      <div className="rounded-2xl bg-pista-100 p-8 text-center">
        <p className="font-display text-2xl text-pista-600">Thank you for writing to us!</p>
        <p className="mt-2 text-cocoa-soft">We&apos;ll get back to you within one working day.</p>
      </div>
    );
  }

  const set =
    (key: keyof ContactMessageInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState('busy');
        setError(null);
        try {
          await browserApi.engagement.contact({ ...form, phone: form.phone || undefined });
          setState('done');
        } catch (err) {
          setError(
            err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
          );
          setState('idle');
        }
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <label className="text-sm font-medium">
        Name
        <input
          required
          value={form.name}
          onChange={set('name')}
          className="input-field mt-1.5"
          autoComplete="name"
        />
      </label>
      <label className="text-sm font-medium">
        Phone <span className="font-normal text-cocoa-soft">(optional)</span>
        <input
          value={form.phone}
          onChange={set('phone')}
          className="input-field mt-1.5"
          inputMode="tel"
          autoComplete="tel"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Email
        <input
          required
          type="email"
          value={form.email}
          onChange={set('email')}
          className="input-field mt-1.5"
          autoComplete="email"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        What&apos;s this about?
        <select value={form.subject} onChange={set('subject')} className="input-field mt-1.5">
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Message
        <textarea
          required
          minLength={5}
          rows={5}
          value={form.message}
          onChange={set('message')}
          className="input-field mt-1.5 resize-y"
        />
      </label>
      {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <button
        disabled={state === 'busy'}
        className="btn-primary sm:col-span-2 sm:justify-self-start"
      >
        {state === 'busy' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
