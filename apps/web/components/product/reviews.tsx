import type { ProductReviews } from '@sweets/types';
import { RatingSummary, Stars } from './stars';
import { WriteReview } from './write-review';

/** Ratings breakdown and approved reviews, server-rendered for SEO. */
export function Reviews({
  productId,
  slug,
  name,
  reviews,
}: {
  productId: string;
  slug: string;
  name: string;
  reviews: ProductReviews | null;
}) {
  const total = reviews?.total ?? 0;
  return (
    <section id="reviews" className="container-page scroll-mt-28 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">From our customers</p>
          <h2 className="mt-2 text-3xl font-light sm:text-4xl">Reviews</h2>
          {reviews && total > 0 && reviews.average !== null ? (
            <>
              <RatingSummary
                average={reviews.average}
                count={total}
                size={18}
                className="mt-4 text-lg"
              />
              <ul className="mt-5 space-y-1.5 text-sm">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = reviews.distribution[star - 1] ?? 0;
                  return (
                    <li key={star} className="flex items-center gap-3">
                      <span className="w-8 tabular-nums text-cocoa-soft">{star} ★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
                        <span
                          className="block h-full rounded-full bg-saffron-500"
                          style={{ width: `${(n / total) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right tabular-nums text-cocoa-soft">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-cocoa-soft">
              No reviews yet. Tried our {name}? Tell others what you thought.
            </p>
          )}
          <WriteReview productId={productId} slug={slug} name={name} />
        </div>

        <ul className="space-y-4">
          {reviews?.items.map((r) => (
            <li key={r.id} className="rounded-3xl bg-white p-5 ring-1 ring-brand-200 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} size={16} />
                <span className="text-xs text-cocoa-soft">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {r.title && <p className="mt-3 font-bold">{r.title}</p>}
              {r.body && <p className="mt-1.5 leading-relaxed text-cocoa-soft">{r.body}</p>}
              <p className="mt-3 flex items-center gap-2 text-xs font-semibold">
                {r.author}
                <span className="rounded-full bg-pista-50 px-2 py-0.5 text-pista-700 ring-1 ring-pista-100">
                  ✓ Verified purchase
                </span>
              </p>
            </li>
          ))}
          {total > (reviews?.items.length ?? 0) && (
            <li className="text-sm text-cocoa-soft">
              Showing the latest {reviews!.items.length} of {total} reviews.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
