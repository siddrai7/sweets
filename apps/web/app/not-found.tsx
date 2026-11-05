import Link from 'next/link';
import { ArtImage } from '@/components/art/art-image';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
      <ArtImage hints={['rasgulla']} background={false} className="h-48 w-48" />
      <p className="eyebrow mt-4">Error 404</p>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">
        This page has <em className="text-brand-600">melted away</em>
      </h1>
      <p className="mt-4 max-w-md text-cocoa-soft">
        The page you&apos;re looking for doesn&apos;t exist. The sweets, however, are very real.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          Browse sweets
        </Link>
        <Link href="/" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
