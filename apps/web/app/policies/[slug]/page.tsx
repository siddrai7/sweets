import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/shop/breadcrumbs';
import { policies, policiesUpdated } from '@/content/policies';

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  return policy
    ? {
        title: policy.title,
        description: policy.description,
        alternates: { canonical: `/policies/${slug}` },
      }
    : {};
}

export default async function PolicyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ label: policy.title, href: `/policies/${slug}` }]} />
      <h1 className="mt-8 text-4xl font-light sm:text-6xl">{policy.title}</h1>
      <p className="mt-3 text-sm text-cocoa-soft">Last updated: {policiesUpdated}</p>
      <div className="mt-10 space-y-8">
        {policy.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl font-normal">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-cocoa-soft">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
