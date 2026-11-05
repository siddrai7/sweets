'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Review, ReviewStatus } from '@sweets/types';
import { Button, Empty, PageHeader, Pagination, Tabs, fmtDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { STOREFRONT_URL as STORE_URL } from '@/lib/catalog';

export default function ReviewsPage() {
  const { api } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<ReviewStatus>('PENDING');
  const [page, setPage] = useState(1);
  const reviews = useQuery({
    queryKey: ['reviews', status, page],
    queryFn: () => api.reviews.list({ status, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });
  const pending = useQuery({
    queryKey: ['reviews', 'pending-count'],
    queryFn: () => api.reviews.list({ status: 'PENDING', pageSize: 1 }),
  });
  const moderate = useMutation({
    mutationFn: ({ r, to, note }: { r: Review; to: ReviewStatus; note?: string }) =>
      api.reviews.moderate(r.id, { status: to, moderationNote: note ?? null }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  return (
    <>
      <PageHeader title="Reviews" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-500">
        Only customers who received the product can review it. Approved reviews appear on the
        product page and in Google results.
      </p>
      <Tabs
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        tabs={[
          { value: 'PENDING', label: 'Waiting', count: pending.data?.total },
          { value: 'APPROVED', label: 'Published' },
          { value: 'REJECTED', label: 'Rejected' },
        ]}
      />
      {reviews.error ? (
        <Empty>Couldn’t load reviews: {reviews.error.message}</Empty>
      ) : !reviews.data?.items.length ? (
        <Empty>
          {reviews.isLoading
            ? 'Loading…'
            : status === 'PENDING'
              ? 'Nothing waiting. 🎉'
              : 'None yet.'}
        </Empty>
      ) : (
        <ul className="space-y-3">
          {reviews.data.items.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <a
                    href={`${STORE_URL}/products/${r.product?.slug}#reviews`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:text-brand-700"
                  >
                    {r.product?.name} ↗
                  </a>
                  <p className="text-amber-500" aria-label={`${r.rating} stars`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {r.author} · {fmtDate(r.createdAt)}
                </p>
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              {r.body ? (
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.body}</p>
              ) : (
                !r.title && <p className="mt-2 text-sm text-slate-400">Rating only, no text.</p>
              )}
              {r.moderationNote && (
                <p className="mt-2 text-xs text-slate-500">Note: {r.moderationNote}</p>
              )}
              <div className="mt-3 flex gap-2">
                {r.status !== 'APPROVED' && (
                  <Button
                    disabled={moderate.isPending}
                    onClick={() => moderate.mutate({ r, to: 'APPROVED' })}
                  >
                    Publish
                  </Button>
                )}
                {r.status !== 'REJECTED' && (
                  <Button
                    variant="danger"
                    disabled={moderate.isPending}
                    onClick={() => {
                      const note = window.prompt('Why? (only staff see this)') ?? undefined;
                      moderate.mutate({ r, to: 'REJECTED', note });
                    }}
                  >
                    {r.status === 'APPROVED' ? 'Unpublish' : 'Reject'}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {reviews.data && (
        <Pagination page={page} pageSize={20} total={reviews.data.total} onPage={setPage} />
      )}
    </>
  );
}
