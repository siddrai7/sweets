'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ManagedUser, Role, UserAudience } from '@sweets/types';
import {
  Badge,
  Button,
  Empty,
  PageHeader,
  Pagination,
  Table,
  Tabs,
  Td,
  fmtDate,
  inputCls,
} from '@/components/ui';
import {
  ConfirmActiveDialog,
  ROLE_INFO,
  ResetPasswordDialog,
  UserFormDialog,
} from '@/components/user-dialogs';
import { useAuth } from '@/lib/auth';

const PAGE_SIZE = 25;
/** Filter selects size to their content instead of filling the row. */
const filterCls = inputCls.replace('w-full', 'w-auto');
const ROLE_TONE: Record<Role, 'blue' | 'amber' | 'slate' | 'green'> = {
  ADMIN: 'blue',
  STAFF: 'green',
  VENDOR: 'amber',
  CUSTOMER: 'slate',
};

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: ManagedUser }
  | { kind: 'password'; user: ManagedUser }
  | { kind: 'active'; user: ManagedUser }
  | null;

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function UsersPage() {
  const { api, user: me } = useAuth();
  const [audience, setAudience] = useState<UserAudience>('team');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<'' | 'true' | 'false'>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog>(null);
  const q = useDebounced(search.trim());

  useEffect(() => setPage(1), [audience, role, status, q]);

  const users = useQuery({
    queryKey: ['users', audience, role, status, q, page],
    queryFn: () =>
      api.users.list({
        audience,
        role: audience === 'team' && role ? role : undefined,
        isActive: status === '' ? undefined : status === 'true',
        search: q || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });
  // Tab counts.
  const teamCount = useQuery({
    queryKey: ['users', 'count', 'team'],
    queryFn: () => api.users.list({ audience: 'team', pageSize: 1 }),
  });
  const customerCount = useQuery({
    queryKey: ['users', 'count', 'customers'],
    queryFn: () => api.users.list({ audience: 'customers', pageSize: 1 }),
  });

  const filtered = !!(q || role || status);
  const close = () => setDialog(null);

  return (
    <>
      <PageHeader
        title="Users"
        actions={<Button onClick={() => setDialog({ kind: 'create' })}>+ Add user</Button>}
      />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Everyone who can sign in: your team and vendor logins for the ERP, and customers of the
        online shop.
      </p>

      <Tabs
        value={audience}
        onChange={(v) => {
          setAudience(v);
          setRole('');
        }}
        tabs={[
          { value: 'team', label: 'Team & vendors', count: teamCount.data?.total },
          { value: 'customers', label: 'Customers', count: customerCount.data?.total },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} max-w-xs`}
        />
        {audience === 'team' && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role | '')}
            className={filterCls}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            {(['ADMIN', 'STAFF', 'VENDOR'] as const).map((r) => (
              <option key={r} value={r}>
                {ROLE_INFO[r].label}
              </option>
            ))}
          </select>
        )}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={filterCls}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
      </div>

      {users.error ? (
        <Empty>Couldn’t load users: {users.error.message}</Empty>
      ) : !users.data?.items.length ? (
        <Empty>
          {users.isLoading
            ? 'Loading…'
            : filtered
              ? 'No users match these filters.'
              : audience === 'team'
                ? 'No team members yet. Add your first one.'
                : 'No customers have signed up yet.'}
        </Empty>
      ) : (
        <>
          <Table head={['User', 'Role', 'Phone', 'Last sign-in', 'Status', '']}>
            {users.data.items.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id} className={u.isActive ? '' : 'bg-slate-50/60 text-slate-500'}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {u.name
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium">
                          {u.name}
                          {isSelf && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_INFO[u.role].label}</Badge>
                    {u.vendor && <div className="mt-1 text-xs text-slate-500">{u.vendor.name}</div>}
                  </Td>
                  <Td className="whitespace-nowrap">{u.phone ?? '—'}</Td>
                  <Td className="whitespace-nowrap text-xs">
                    {u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}
                  </Td>
                  <Td>
                    <Badge tone={u.isActive ? 'green' : 'red'}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        onClick={() => setDialog({ kind: 'edit', user: u })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setDialog({ kind: 'password', user: u })}
                      >
                        Reset password
                      </Button>
                      {!isSelf && (
                        <Button
                          variant={u.isActive ? 'danger' : 'secondary'}
                          onClick={() => setDialog({ kind: 'active', user: u })}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={users.data.total} onPage={setPage} />
        </>
      )}

      {dialog?.kind === 'create' && <UserFormDialog onClose={close} />}
      {dialog?.kind === 'edit' && (
        <UserFormDialog user={dialog.user} isSelf={dialog.user.id === me?.id} onClose={close} />
      )}
      {dialog?.kind === 'password' && (
        <ResetPasswordDialog
          user={dialog.user}
          isSelf={dialog.user.id === me?.id}
          onClose={close}
        />
      )}
      {dialog?.kind === 'active' && <ConfirmActiveDialog user={dialog.user} onClose={close} />}
    </>
  );
}
