'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { isErpUser, useAuth } from '@/lib/auth';

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8"
      >
        <h1 className="text-xl font-semibold">Sweets ERP</h1>
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white disabled:opacity-60"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
