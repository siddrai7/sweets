'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { Field, inputCls } from '@/components/ui';
import { isErpUser, useAuth } from '@/lib/auth';
import { BRAND } from '@/lib/brand';
import logo from '@/public/logo.png';

export default function LoginPage() {
  const router = useRouter();
  const { api, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = await api.auth.login({ email, password });
      if (!isErpUser(auth.user)) {
        await api.auth.logout(auth.refreshToken);
        throw new Error('This account does not have ERP access');
      }
      signIn(auth);
      router.replace(auth.user.role === 'VENDOR' ? '/purchase-orders' : '/');
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-brand-800 p-12 text-brand-100 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgb(163_34_47/0.6),transparent_75%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-900/80 to-transparent" />
        <Image
          src={logo}
          alt={BRAND}
          sizes="360px"
          priority
          className="relative h-auto w-80 drop-shadow-[0_24px_40px_rgb(0_0_0/0.45)]"
        />
        <p className="relative mt-10 max-w-sm text-center font-display text-2xl font-light leading-snug text-white">
          Orders, stock and the kitchen, <em className="text-saffron-300">all in one place.</em>
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Image src={logo} alt="" sizes="96px" className="mb-6 h-24 w-auto lg:hidden" priority />
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-saffron-600">
            Back office
          </p>
          <h1 className="mt-2 text-4xl font-medium text-brand-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">For the {BRAND} team and vendors.</p>

          <div className="mt-8 space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} py-2.5`}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} py-2.5`}
              />
            </Field>
          </div>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
