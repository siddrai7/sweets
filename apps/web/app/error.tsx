'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** Friendly fallback when a page throws, instead of a blank screen. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">
        Our kitchen hit a <em className="text-brand-600">small snag</em>
      </h1>
      <p className="mt-4 max-w-md text-cocoa-soft">
        Please try again. If it keeps happening, your cart is safe and you can call us to order.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
