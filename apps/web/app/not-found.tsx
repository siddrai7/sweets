import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl font-semibold">We couldn&apos;t find that page</h1>
      <Link href="/products" className="mt-6 inline-block text-brand-700 underline">
        Browse sweets
      </Link>
    </div>
  );
}
