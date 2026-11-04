'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ManagedUser, Role } from '@sweets/types';
import { Button, Field, Modal, inputCls } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** What each role can do, shown when choosing one. Mirrors the API's @Roles guards. */
export const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  ADMIN: {
    label: 'Admin',
    description: 'Everything, including users, vendors, locations and archiving products.',
  },
  STAFF: {
    label: 'Staff',
    description: 'Day-to-day operations: orders, products, inventory and purchase orders.',
  },
  VENDOR: {
    label: 'Vendor',
    description: 'A supplier login. Sees and acknowledges only their own purchase orders.',
  },
  CUSTOMER: {
    label: 'Customer',
    description: 'Shops on the website. No ERP access.',
  },
};

const TEAM_ROLES: Role[] = ['STAFF', 'ADMIN', 'VENDOR'];

/** 12-character password without look-alike characters (0/O, 1/l/I). */
export function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        type={show ? 'text' : 'password'}
        required
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} font-mono`}
      />
      <Button type="button" variant="secondary" onClick={() => setShow((s) => !s)}>
        {show ? 'Hide' : 'Show'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          onChange(generatePassword());
          setShow(true);
        }}
      >
        Generate
      </Button>
    </div>
  );
}

/** Shown once after creating a user or resetting a password, so the admin can pass it on. */
function Credentials({
  email,
  password,
  onDone,
  title,
}: {
  email: string;
  password: string;
  onDone: () => void;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = `Sign in at ${typeof window !== 'undefined' ? window.location.origin : ''}/login\nEmail: ${email}\nPassword: ${password}`;
  return (
    <Modal
      title={title}
      description="Share these sign-in details privately. The password won’t be shown again."
      onClose={onDone}
      footer={<Button onClick={onDone}>Done</Button>}
    >
      <dl className="space-y-2 rounded-lg bg-slate-50 p-4 font-mono text-sm">
        <div className="flex gap-3">
          <dt className="w-20 text-slate-500">Email</dt>
          <dd className="break-all">{email}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 text-slate-500">Password</dt>
          <dd className="break-all">{password}</dd>
        </div>
      </dl>
      <Button
        variant="secondary"
        className="mt-3"
        onClick={() =>
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
        }
      >
        {copied ? 'Copied ✓' : 'Copy sign-in details'}
      </Button>
      <p className="mt-3 text-xs text-slate-500">
        Ask them to change it after their first sign-in. You can reset it any time from the user
        list.
      </p>
    </Modal>
  );
}

/** Create a user (no `user`) or edit an existing one. */
export function UserFormDialog({
  user,
  isSelf,
  defaults,
  onClose,
}: {
  user?: ManagedUser;
  isSelf?: boolean;
  /** Pre-fill a new user, e.g. a vendor login started from the Vendors page. */
  defaults?: { role?: Role; vendorId?: string };
  onClose: () => void;
}) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const editing = !!user;
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: (user?.role ?? defaults?.role ?? 'STAFF') as Role,
    vendorId: user?.vendorId ?? defaults?.vendorId ?? '',
    password: editing ? '' : generatePassword(),
  });
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const vendors = useQuery({
    queryKey: ['vendors'],
    queryFn: api.vendors.list,
    enabled: form.role === 'VENDOR',
  });
  const roles = user?.role === 'CUSTOMER' ? (['CUSTOMER', ...TEAM_ROLES] as Role[]) : TEAM_ROLES;

  const save = useMutation({
    mutationFn: () => {
      const common = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        vendorId: form.role === 'VENDOR' ? form.vendorId || null : null,
      };
      return editing
        ? api.users.update(user.id, common)
        : api.users.create({
            ...common,
            email: form.email.trim(),
            password: form.password,
          });
    },
    onSuccess: (saved) => {
      void qc.invalidateQueries({ queryKey: ['users'] });
      if (editing) onClose();
      else setCreated({ email: saved.email, password: form.password });
    },
  });

  if (created) {
    return <Credentials title={`${form.name} can now sign in`} {...created} onDone={onClose} />;
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      title={editing ? `Edit ${user.name}` : 'Add a user'}
      description={
        editing ? user.email : 'Give a team member or supplier their own sign-in to the ERP.'
      }
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="user-form" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              required
              autoFocus
              maxLength={100}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone" hint="Optional">
            <input
              type="tel"
              inputMode="tel"
              minLength={8}
              maxLength={15}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field
          label="Email"
          hint={editing ? 'Email is their login and can’t be changed.' : 'Used to sign in.'}
        >
          <input
            type="email"
            required
            disabled={editing}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputCls}
          />
        </Field>

        <fieldset disabled={isSelf}>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Role</legend>
          <div className="grid gap-2">
            {roles.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                  form.role === r
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${isSelf ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={form.role === r}
                  onChange={() => set('role', r)}
                  className="mt-0.5 accent-brand-600"
                />
                <span>
                  <span className="font-medium">{ROLE_INFO[r].label}</span>
                  <span className="block text-xs text-slate-500">{ROLE_INFO[r].description}</span>
                </span>
              </label>
            ))}
          </div>
          {isSelf && (
            <p className="mt-1.5 text-xs text-slate-500">
              You can’t change your own role. Another admin can do it for you.
            </p>
          )}
        </fieldset>

        {form.role === 'VENDOR' && (
          <Field
            label="Vendor"
            hint={
              vendors.data?.length === 0
                ? 'No vendors yet. Add the supplier on the Vendors page first.'
                : 'They will only see purchase orders for this vendor.'
            }
          >
            <select
              required
              value={form.vendorId}
              onChange={(e) => set('vendorId', e.target.value)}
              className={inputCls}
            >
              <option value="">{vendors.isLoading ? 'Loading…' : 'Select a vendor…'}</option>
              {vendors.data?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {!v.isActive && ' (inactive: logins blocked)'}
                </option>
              ))}
            </select>
          </Field>
        )}

        {!editing && (
          <Field
            label="Temporary password"
            hint="At least 8 characters. You’ll see it once more after saving."
          >
            <PasswordInput value={form.password} onChange={(v) => set('password', v)} />
          </Field>
        )}

        {editing && form.role !== user.role && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Changing the role signs {user.name.split(' ')[0]} out on every device so the new
            permissions take effect.
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

export function ResetPasswordDialog({
  user,
  isSelf,
  onClose,
}: {
  user: ManagedUser;
  isSelf?: boolean;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [password, setPassword] = useState(generatePassword);
  const [done, setDone] = useState(false);
  const reset = useMutation({
    mutationFn: () => api.users.resetPassword(user.id, password),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <Credentials
        title={`New password for ${user.name}`}
        email={user.email}
        password={password}
        onDone={onClose}
      />
    );
  }

  return (
    <Modal
      title={isSelf ? 'Change your password' : `Reset password for ${user.name}`}
      description={
        isSelf
          ? 'You’ll be signed out everywhere, including here, and must sign in again.'
          : 'They’ll be signed out everywhere and must use the new password.'
      }
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="reset-form" disabled={reset.isPending}>
            {reset.isPending ? 'Resetting…' : 'Reset password'}
          </Button>
        </>
      }
    >
      <form
        id="reset-form"
        onSubmit={(e) => {
          e.preventDefault();
          reset.mutate();
        }}
        className="space-y-3"
      >
        <Field label="New password" hint="At least 8 characters.">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
        {reset.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {reset.error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}

export function ConfirmActiveDialog({ user, onClose }: { user: ManagedUser; onClose: () => void }) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const activate = !user.isActive;
  const toggle = useMutation({
    mutationFn: () => api.users.setActive(user.id, activate),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <Modal
      title={activate ? `Reactivate ${user.name}?` : `Deactivate ${user.name}?`}
      onClose={onClose}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={activate ? 'primary' : 'danger'}
            disabled={toggle.isPending}
            onClick={() => toggle.mutate()}
          >
            {activate ? 'Reactivate' : 'Deactivate'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {activate
          ? 'They’ll be able to sign in again with their existing password.'
          : 'They’ll be signed out everywhere and won’t be able to sign in. Their orders and history are kept, and you can reactivate them later.'}
      </p>
      {toggle.error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {toggle.error.message}
        </p>
      )}
    </Modal>
  );
}
