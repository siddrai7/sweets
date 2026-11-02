import Link from 'next/link';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
} from '@/components/ui/icons';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import { site } from '@/lib/site';

export async function Footer() {
  const tree = buildCategoryTree(await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []));

  return (
    <footer className="mt-24 bg-brand-900 text-brand-100">
      <div className="border-b border-white/10">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Sweet news, straight to your inbox
            </h2>
            <p className="mt-2 text-sm text-brand-200">
              Festive launches, offers and new arrivals. No spam, ever.
            </p>
          </div>
          <NewsletterForm tone="dark" />
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-white">{site.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-brand-200">{site.description}</p>
          <div className="mt-5 flex gap-3">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full bg-white/10 p-2.5 hover:bg-white/20"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-full bg-white/10 p-2.5 hover:bg-white/20"
            >
              <FacebookIcon size={18} />
            </a>
          </div>
        </div>

        <FooterLinks
          title="Shop"
          links={[
            { href: '/shop', label: 'All products' },
            ...tree.map((c) => ({ href: `/shop/${c.slug}`, label: c.name })),
          ]}
        />
        <FooterLinks
          title="Help"
          links={[
            { href: '/our-story', label: 'Our Story' },
            { href: '/contact', label: 'Contact us' },
            { href: '/policies/shipping', label: 'Shipping policy' },
            { href: '/policies/refund', label: 'Cancellation & refunds' },
            { href: '/policies/terms', label: 'Terms & conditions' },
            { href: '/policies/privacy', label: 'Privacy policy' },
          ]}
        />

        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-white">
            Visit us
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-brand-200">
            <li className="flex gap-3">
              <PinIcon size={18} className="mt-0.5 shrink-0" /> {site.contact.address}
            </li>
            <li className="flex gap-3">
              <ClockIcon size={18} className="mt-0.5 shrink-0" /> {site.contact.hours}
            </li>
            <li>
              <a
                href={`tel:${site.contact.phone.replace(/\s/g, '')}`}
                className="flex gap-3 hover:text-white"
              >
                <PhoneIcon size={18} className="shrink-0" /> {site.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="flex gap-3 hover:text-white">
                <MailIcon size={18} className="shrink-0" /> {site.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-brand-300 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>Prices inclusive of GST · FSSAI Lic. No. XXXXXXXXXXXXXX</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-brand-200 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
