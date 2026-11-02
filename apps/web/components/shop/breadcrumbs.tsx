import Link from 'next/link';
import { ChevronRight } from '@/components/ui/icons';
import { site } from '@/lib/site';

export interface Crumb {
  label: string;
  href: string;
}

/** Visible breadcrumbs plus BreadcrumbList structured data for search results. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Home', href: '/' }, ...items];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${site.url}${c.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-cocoa-soft">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-brand-300" />}
            {i === all.length - 1 ? (
              <span aria-current="page" className="text-cocoa">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-brand-600">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
