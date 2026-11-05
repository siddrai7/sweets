'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError } from '@sweets/api-client';
import type { ReviewEligibility } from '@sweets/types';
import { StarIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { useSession } from '@/lib/session';

const LABELS = ['', 'Didn’t like it', 'It was okay', 'Good', 'Very good', 'Loved it!'];

export function WriteReview({ slug, name }: { productId: string; slug: string; name: string }) {
  const { user, ready, api } = useSession();
  const [me, setMe] = useState<ReviewEligibility | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && user)
      api.reviews
        .mine(slug)
        .then(setMe)
        .catch(() => setMe(null));
  }, [ready, user, api, slug]);

  if (!ready) return null;
  if (!user) {
    return (
      <p className="mt-6 text-sm text-cocoa-soft">
        <Link href={`/login?next=/products/${slug}%23reviews`} className="font-bold text-brand-600">
          Sign in
        </Link>{' '}
        to review sweets you’ve ordered.
      </p>
    );
  }
  if (!me) return null;
  if (!me.canReview) {
    return (
      <p className="mt-6 text-sm text-cocoa-soft">
        You can review {name} once you’ve received an order of it.
      </p>
    );
  }
  return (
    <div className="mt-6">
      {me.review && (
        <p className="mb-3 rounded-2xl bg-brand-50 p-3 text-sm ring-1 ring-brand-200">
          {me.review.status === 'PENDING'
            ? 'Thanks! Your review will appear once we’ve checked it.'
            : me.review.status === 'APPROVED'
              ? 'Your review is live. Thank you!'
              : 'Your review wasn’t published. You can edit and resubmit it.'}
        </p>
      )}
      <button onClick={() => setOpen(true)} className="btn-ghost">
        {me.review ? 'Edit your review' : 'Write a review'}
      </button>
      {open && (
        <ReviewSheet
          slug={slug}
          name={name}
          initial={me.review}
          onClose={() => setOpen(false)}
          onSaved={(review) => {
            setMe({ ...me, review, reason: 'already-reviewed' });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ReviewSheet({
  slug,
  name,
  initial,
  onClose,
  onSaved,
}: {
  slug: string;
  name: string;
  initial: ReviewEligibility['review'];
  onClose: () => void;
  onSaved: (r: NonNullable<ReviewEligibility['review']>) => void;
}) {
  const { api } = useSession();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shown = hover || rating;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError('Tap a star to rate');
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.reviews.write(slug, { rating, title: title || null, body: body || null }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save your review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Review ${name}`}
      footer={
        <button form="review-form" disabled={busy} className="btn-primary w-full py-3.5">
          {busy ? 'Sending…' : 'Submit review'}
        </button>
      }
    >
      <form id="review-form" onSubmit={submit} className="space-y-4">
        <div>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-label="Rating"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className={`p-1 transition active:scale-90 ${n <= shown ? 'text-saffron-500' : 'text-brand-200'}`}
              >
                <StarIcon size={34} />
              </button>
            ))}
          </div>
          <p className="mt-1 h-5 text-sm font-semibold text-cocoa-soft">{LABELS[shown]}</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">
            Headline (optional)
          </span>
          <input
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Just like my nani made"
            className="input-field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-cocoa-soft">
            Your review (optional)
          </span>
          <textarea
            value={body}
            maxLength={2000}
            rows={4}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Taste, freshness, packaging…"
            className="input-field"
          />
        </label>
        <p className="text-xs text-cocoa-soft">
          Reviews are checked before they appear, usually within a day.
        </p>
        {error && (
          <p className="rounded-xl bg-brand-100 px-3 py-2.5 text-sm text-brand-700" role="alert">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}
