import type { Metadata } from 'next';
import Link from 'next/link';
import { Promises } from '@/components/home/promises';
import { LogoBadge } from '@/components/layout/logo';
import { Breadcrumbs } from '@/components/shop/breadcrumbs';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Our story',
  description: `${site.name} is a new sweets and snacks kitchen delivering across ${site.delivery.area}.`,
  alternates: { canonical: '/our-story' },
};

// Placeholder copy: replace with the founders' own words once they are written.
export default function OurStoryPage() {
  return (
    <>
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Our story', href: '/our-story' }]} />
        <section className="mt-8 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow">A new kitchen in {site.contact.city}</p>
            <h1 className="mt-3 text-[2.6rem] font-light leading-[1.02] sm:text-7xl">
              Just starting, <em className="text-brand-600">and doing it properly.</em>
            </h1>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-cocoa-soft">
              <p>
                {site.name} is a new name. We started with a simple idea: sweets and snacks should
                taste like they were made today, because they were.
              </p>
              <p>
                So we cook in small batches with pure ghee and full-cream milk, skip the
                preservatives, and deliver across {site.delivery.area} the same day. We would rather
                sell out than sell yesterday&apos;s batch.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-brand-800 p-10 sm:p-14">
            <span className="block h-64 sm:h-80">
              <LogoBadge size={320} fluid />
            </span>
          </div>
        </section>
      </div>

      <Promises showLink={false} />

      <section className="container-page py-8 text-center">
        <h2 className="text-3xl font-light sm:text-4xl">Taste the first batches</h2>
        <Link href="/shop" className="btn-primary mt-6">
          Shop sweets and snacks
        </Link>
      </section>
    </>
  );
}
