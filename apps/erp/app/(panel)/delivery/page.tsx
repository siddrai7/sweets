'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { DeliverySettings, ServiceArea } from '@sweets/types';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  PageHeader,
  Table,
  Td,
  inputCls,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function DeliveryPage() {
  return (
    <>
      <PageHeader title="Delivery" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Where you deliver and the time slots customers can choose at checkout. Changes apply to the
        shop immediately.
      </p>
      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <ServiceAreas />
        <SettingsForm />
      </div>
    </>
  );
}

function ServiceAreas() {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();
  const areas = useQuery({ queryKey: ['delivery', 'areas'], queryFn: api.delivery.areas });
  const [pincodes, setPincodes] = useState('');
  const [label, setLabel] = useState('');
  const [filter, setFilter] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['delivery', 'areas'] });

  const parsed = useMemo(() => [...new Set(pincodes.match(/\b\d{6}\b/g) ?? [])], [pincodes]);
  const add = useMutation({
    mutationFn: () => api.delivery.bulkAreas({ pincodes: parsed, label: label.trim() }),
    onSuccess: () => {
      setPincodes('');
      void refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: (a: ServiceArea) => api.delivery.updateArea(a.id, { isActive: !a.isActive }),
    onSuccess: () => void refresh(),
  });
  const remove = useMutation({
    mutationFn: (a: ServiceArea) => api.delivery.deleteArea(a.id),
    onSuccess: () => void refresh(),
  });

  const list = (areas.data ?? []).filter(
    (a) =>
      !filter || a.pincode.includes(filter) || a.label.toLowerCase().includes(filter.toLowerCase()),
  );
  const active = areas.data?.filter((a) => a.isActive).length ?? 0;

  return (
    <section>
      <h2 className="mb-1 font-medium">Service areas</h2>
      <p className="mb-4 text-sm text-slate-500">
        {areas.data?.length
          ? `Delivering to ${active} pincode${active === 1 ? '' : 's'}. Other pincodes can only order for pickup.`
          : 'No pincodes yet, so the shop accepts deliveries anywhere. Add pincodes to limit delivery.'}
      </p>

      {isAdmin && (
        <Card className="mb-4 p-4">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (parsed.length && label.trim()) add.mutate();
            }}
          >
            <Field
              label="Pincodes"
              hint={
                parsed.length
                  ? `${parsed.length} pincode${parsed.length > 1 ? 's' : ''}`
                  : 'Paste one or many, separated by commas or spaces.'
              }
            >
              <input
                value={pincodes}
                onChange={(e) => setPincodes(e.target.value)}
                placeholder="413102, 413133"
                className={inputCls}
              />
            </Field>
            <Field label="Area name" hint="Shown to customers.">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Baramati"
                maxLength={60}
                className={inputCls}
              />
            </Field>
            <Button
              disabled={!parsed.length || !label.trim() || add.isPending}
              className="mb-5 py-2"
            >
              {add.isPending ? 'Adding…' : 'Add'}
            </Button>
          </form>
          {add.error && <p className="text-sm text-red-700">{add.error.message}</p>}
        </Card>
      )}

      {!!areas.data?.length && (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by pincode or area"
          className={`${inputCls} mb-3 max-w-xs`}
        />
      )}
      {areas.error ? (
        <Empty>Couldn’t load areas: {areas.error.message}</Empty>
      ) : !areas.data ? (
        <Empty>Loading…</Empty>
      ) : areas.data.length === 0 ? (
        <Empty>No service areas yet.</Empty>
      ) : (
        <Table head={['Pincode', 'Area', 'Status', '']}>
          {list.map((a) => (
            <tr key={a.id} className={a.isActive ? '' : 'bg-slate-50/60 text-slate-500'}>
              <Td className="font-mono">{a.pincode}</Td>
              <Td>{a.label}</Td>
              <Td>
                <Badge tone={a.isActive ? 'green' : 'slate'}>
                  {a.isActive ? 'Delivering' : 'Paused'}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap text-right">
                {isAdmin && (
                  <div className="flex justify-end gap-1.5">
                    <Button variant="secondary" onClick={() => toggle.mutate(a)}>
                      {a.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        window.confirm(`Stop delivering to ${a.pincode}?`) && remove.mutate(a)
                      }
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}

function SettingsForm() {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ['delivery', 'settings'], queryFn: api.delivery.settings });
  const [draft, setDraft] = useState<DeliverySettings | null>(null);
  const [closedDate, setClosedDate] = useState('');
  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (d: DeliverySettings) => api.delivery.updateSettings(d),
    onSuccess: (d) => qc.setQueryData(['delivery', 'settings'], d),
  });

  if (!draft) return <Empty>{settings.error ? settings.error.message : 'Loading…'}</Empty>;
  const set = <K extends keyof DeliverySettings>(k: K, v: DeliverySettings[K]) =>
    setDraft({ ...draft, [k]: v });
  const setSlot = (i: number, patch: Partial<DeliverySettings['slots'][number]>) =>
    set(
      'slots',
      draft.slots.map((s, j) => (i === j ? { ...s, ...patch } : s)),
    );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section>
      <h2 className="mb-1 font-medium">Time slots</h2>
      <p className="mb-4 text-sm text-slate-500">
        Customers pick one at checkout. Remove all slots to deliver as soon as possible instead.
      </p>
      <Card className="p-4">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              ...draft,
              slots: [...draft.slots].sort((a, b) => a.start.localeCompare(b.start)),
            });
          }}
        >
          <fieldset disabled={!isAdmin} className="space-y-5">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-slate-500">
                <span>From</span>
                <span>To</span>
                <span>Max orders</span>
                <span className="w-7" />
              </div>
              {draft.slots.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                  <input
                    type="time"
                    required
                    value={s.start}
                    onChange={(e) => setSlot(i, { start: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="time"
                    required
                    value={s.end}
                    onChange={(e) => setSlot(i, { end: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Any"
                    value={s.capacity ?? ''}
                    onChange={(e) =>
                      setSlot(i, { capacity: e.target.value ? Number(e.target.value) : null })
                    }
                    className={inputCls}
                  />
                  <button
                    type="button"
                    aria-label="Remove slot"
                    onClick={() =>
                      set(
                        'slots',
                        draft.slots.filter((_, j) => j !== i),
                      )
                    }
                    className="w-7 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {draft.slots.length < 12 && (
                <button
                  type="button"
                  onClick={() =>
                    set('slots', [...draft.slots, { start: '10:00', end: '12:00', capacity: null }])
                  }
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  + Add a slot
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Preparation time" hint="Minutes before a slot starts.">
                <input
                  type="number"
                  min={0}
                  max={1440}
                  required
                  value={draft.leadMinutes}
                  onChange={(e) => set('leadMinutes', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Days to show" hint="1 = today only.">
                <input
                  type="number"
                  min={1}
                  max={14}
                  required
                  value={draft.daysAhead}
                  onChange={(e) => set('daysAhead', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Same-day cut-off" hint="Later orders get tomorrow’s slots.">
                <input
                  type="time"
                  required
                  value={draft.sameDayCutoff}
                  onChange={(e) => set('sameDayCutoff', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Closed for delivery</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  min={today}
                  value={closedDate}
                  onChange={(e) => setClosedDate(e.target.value)}
                  className={inputCls}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!closedDate || draft.closedDates.includes(closedDate)}
                  onClick={() => {
                    set('closedDates', [...draft.closedDates, closedDate].sort());
                    setClosedDate('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.closedDates.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs"
                  >
                    {new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    <button
                      type="button"
                      aria-label={`Remove ${d}`}
                      onClick={() =>
                        set(
                          'closedDates',
                          draft.closedDates.filter((x) => x !== d),
                        )
                      }
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {!draft.closedDates.length && (
                  <span className="text-xs text-slate-500">No closures planned.</span>
                )}
              </div>
            </div>
          </fieldset>

          {save.error && <p className="text-sm text-red-700">{save.error.message}</p>}
          {save.isSuccess && !save.isPending && (
            <p className="text-sm text-green-700">Saved. The shop now offers these slots.</p>
          )}
          {isAdmin && (
            <Button disabled={save.isPending} className="w-full py-2">
              {save.isPending ? 'Saving…' : 'Save delivery settings'}
            </Button>
          )}
        </form>
      </Card>
    </section>
  );
}
