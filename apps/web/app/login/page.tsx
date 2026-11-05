'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@sweets/api-client';
import { ArtImage } from '@/components/art/art-image';
import { LogoMark } from '@/components/layout/logo';
import { CheckIcon } from '@/components/ui/icons';
import { useSession } from '@/lib/session';
import { site } from '@/lib/site';

const PERKS = [
  'Track every order, from kitchen to doorstep',
  'Faster checkout with saved details',
  'First to hear about festive launches',
];

function LoginForm() {
  const router = useRouter();
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
      // Read at submit time (not via useSearchParams) so the form is in the server HTML and
      // doesn't pop in after load. Only same-site paths are allowed.
      const next = new URLSearchParams(window.location.search).get('next') ?? '/';
      router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const input = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    required = true,
    autoComplete?: string,
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">{label}</span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="input-field"
      />
    </label>
  );

  return (
    <div className="container-page py-8 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white ring-1 ring-brand-200 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-brand-100 lg:block">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
          <LogoMark size={48} className="relative text-brand-600" />
          <h2 className="relative mt-10 text-4xl font-light leading-tight text-white">
            Welcome to the <em className="text-saffron-300">{site.name}</em> family.
          </h2>
          <ul className="relative mt-8 space-y-3.5 text-sm">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron-400/20 text-saffron-300">
                  <CheckIcon size={12} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <ArtImage
            hints={['motichoor-ladoo']}
            background={false}
            className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72"
          />
        </div>

        <form onSubmit={submit} className="space-y-5 p-6 sm:p-12">
          <div className="grid grid-cols-2 rounded-full bg-brand-100 p-1 text-sm font-bold">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-full py-2.5 transition ${mode === m ? 'bg-white shadow-card' : 'text-cocoa-soft'}`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
          <div>
            <h1 className="text-3xl font-light sm:text-4xl">
              {mode === 'login' ? 'Welcome back' : 'Let’s get you started'}
            </h1>
            <p className="mt-1.5 text-sm text-cocoa-soft">
              {mode === 'login'
                ? 'Sign in to track orders and check out faster.'
                : 'It takes less than a minute.'}
            </p>
          </div>
          {mode === 'register' && input('name', 'Full name', 'text', true, 'name')}
          {input('email', 'Email', 'email', true, 'email')}
          {mode === 'register' && input('phone', 'Mobile (optional)', 'tel', false, 'tel')}
          {input(
            'password',
            'Password',
            'password',
            true,
            mode === 'login' ? 'current-password' : 'new-password',
          )}
          {error && (
            <p
              className="rounded-xl bg-brand-100 px-3 py-2.5 text-sm font-medium text-brand-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <button disabled={busy} className="btn-primary w-full py-3.5">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <p className="text-center text-xs text-cocoa-soft">
            By continuing you agree to our{' '}
            <Link href="/policies/terms" className="font-semibold underline underline-offset-2">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/policies/privacy" className="font-semibold underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
