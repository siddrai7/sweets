import type { Metadata } from 'next';
import Link from 'next/link';
import { Promises } from '@/components/home/promises';
import { ProductImage } from '@/components/product/product-image';
import { Breadcrumbs } from '@/components/shop/breadcrumbs';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Our story',
  description: `How ${site.name} has been handcrafting traditional Indian sweets since ${site.established}.`,
  alternates: { canonical: '/our-story' },
};

// Placeholder copy: replace with the client's real history, founder and milestones.
const milestones = [
  {
    year: site.established,
    text: 'Our first sweet shop opens with a handful of family recipes and a small kitchen.',
  },
  {
    year: '2002',
    text: 'A second outlet opens as word spreads about our kaju katli and motichoor ladoo.',
  },
  {
    year: '2015',
    text: 'We open a central kitchen so every outlet gets the same fresh sweets each morning.',
  },
  { year: 'Today', text: 'Serving thousands of families every day, in our shops and now online.' },
];

export default function OurStoryPage() {
  return (
    <>
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Our story', href: '/our-story' }]} />
        <section className="mt-8 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron-600">
              Since {site.established}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">
              Happiness, one sweet at a time
            </h1>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-cocoa-soft">
              <p>
                {site.name} began in {site.established} as a small family sweet shop with one simple
                belief: sweets should taste the way they did in our grandmothers&apos; kitchens,
                made with pure ghee, full-cream milk and patience.
              </p>
              <p>
                More than three decades later, that belief hasn&apos;t changed. Every ladoo is still
                rolled by hand, every batch of kaju katli is still made fresh each morning, and
                every recipe is still the one we started with.
              </p>
            </div>
          </div>
          <ProductImage
            name={`${site.name} kitchen`}
            slug="our-story-kitchen"
            className="aspect-[4/3] rounded-3xl"
          />
        </section>
      </div>

      <Promises />

      <section className="container-page py-12">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Our journey</h2>
        <ol className="relative mx-auto mt-10 max-w-2xl border-l-2 border-brand-200 pl-8">
          {milestones.map((m) => (
            <li key={m.year} className="relative pb-10 last:pb-0">
              <span className="absolute -left-[2.6rem] top-1 h-4 w-4 rounded-full border-4 border-brand-50 bg-saffron-500" />
              <p className="font-display text-2xl font-semibold text-brand-600">{m.year}</p>
              <p className="mt-1 text-cocoa-soft">{m.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page py-8 text-center">
        <h2 className="text-3xl font-semibold">Taste the tradition</h2>
        <Link href="/shop" className="btn-primary mt-6">
          Shop our sweets
        </Link>
      </section>
    </>
  );
}
