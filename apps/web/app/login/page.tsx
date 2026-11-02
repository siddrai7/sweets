'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { useSession } from '@/lib/session';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const { api, signIn } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth =
        mode === 'login'
          ? await api.auth.login({ email: form.email, password: form.password })
          : await api.auth.register({ ...form, phone: form.phone || undefined });
      signIn(auth);
      router.replace(next.startsWith('/') ? next : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const input = (key: keyof typeof form, label: string, type = 'text', required = true) => (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="input-field mt-1.5"
      />
    </label>
  );

  return (
    <form
      onSubmit={submit}
      className="mx-4 my-16 space-y-4 rounded-3xl border border-brand-200 bg-white p-8 sm:mx-auto sm:max-w-sm"
    >
      <h1 className="text-3xl font-semibold">
        {mode === 'login' ? 'Welcome back' : 'Create an account'}
      </h1>
      {mode === 'register' && input('name', 'Name')}
      {input('email', 'Email', 'email')}
      {mode === 'register' && input('phone', 'Phone (optional)', 'tel', false)}
      {input('password', 'Password', 'password')}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="w-full text-sm text-brand-700"
      >
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
