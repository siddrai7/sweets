import Link from 'next/link';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import {
  ClockIcon,
  DropIcon,
  FacebookIcon,
  InstagramIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  SunIcon,
  TruckIcon,
  VegMark,
} from '@/components/ui/icons';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import { site } from '@/lib/site';
import { LogoMark } from './logo';

const PROMISES = [
  { icon: SunIcon, title: 'Made fresh daily', body: 'Small batches, every morning' },
  { icon: DropIcon, title: 'Pure desi ghee', body: 'No palm oil, no shortcuts' },
  {
    icon: TruckIcon,
    title: 'Same-day delivery',
    body: `Order before ${site.delivery.sameDayCutoff}`,
  },
  { icon: LockIcon, title: 'Safe checkout', body: 'Cash on delivery available' },
];

export async function Footer() {
  const tree = buildCategoryTree(await safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []));

  return (
    <footer className="pb-mobile-nav mt-20 bg-brand-900 text-brand-200 lg:mt-28">
      <div className="border-b border-white/10">
        <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-saffron-400/30 text-saffron-300">
                <Icon size={20} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-white">{title}</span>
                <span className="text-xs text-brand-300">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
        <div>
          <Link href="/" prefetch={false} className="inline-flex items-center gap-3">
            <LogoMark size={44} className="text-brand-600" />
            <span>
              <span className="block font-display text-2xl font-medium text-white">
                {site.name}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.32em] text-saffron-400">
                Est. {site.established}
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-300">{site.description}</p>

          <div className="mt-8 max-w-sm">
            <p className="font-display text-lg text-white">
              Sweet news, <em className="text-saffron-300">straight to your inbox</em>
            </p>
            <p className="mb-3 mt-1 text-xs text-brand-300">
              Festive launches and offers. No spam, ever.
            </p>
            <NewsletterForm tone="dark" />
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
            { href: '/orders/track', label: 'Track my order' },
            { href: '/account/wishlist', label: 'Wishlist' },
            { href: '/our-story', label: 'Our story' },
            { href: '/contact', label: 'Contact us' },
            { href: '/policies/shipping', label: 'Shipping policy' },
            { href: '/policies/refund', label: 'Cancellation & refunds' },
            { href: '/policies/terms', label: 'Terms & conditions' },
            { href: '/policies/privacy', label: 'Privacy policy' },
          ]}
        />

        <div>
          <h3 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-saffron-400">
            Visit the shop
          </h3>
          <ul className="mt-5 space-y-3.5 text-sm">
            <li className="flex gap-3">
              <PinIcon size={18} className="mt-0.5 shrink-0 text-brand-400" />{' '}
              {site.contact.address}
            </li>
            <li className="flex gap-3">
              <ClockIcon size={18} className="mt-0.5 shrink-0 text-brand-400" />{' '}
              {site.contact.hours}
            </li>
            <li>
              <a
                href={`tel:${site.contact.phone.replace(/\s/g, '')}`}
                className="flex min-h-11 items-center gap-3 transition hover:text-white"
              >
                <PhoneIcon size={18} className="shrink-0 text-brand-400" /> {site.contact.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.contact.email}`}
                className="flex min-h-11 items-center gap-3 transition hover:text-white"
              >
                <MailIcon size={18} className="shrink-0 text-brand-400" /> {site.contact.email}
              </a>
            </li>
          </ul>
          <div className="mt-6 flex gap-2.5">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-white/15 p-2.5 transition hover:border-saffron-400 hover:text-saffron-300"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-full border border-white/15 p-2.5 transition hover:border-saffron-400 hover:text-saffron-300"
            >
              <FacebookIcon size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Handcrafted in Thane with love.
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span className="rounded-[3px] bg-white p-px">
                <VegMark size={12} />
              </span>
              100% vegetarian
            </span>
            <span>Prices inclusive of GST</span>
            <span>FSSAI Lic. No. XXXXXXXXXXXXXX</span>
          </p>
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
      <h3 className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-saffron-400">
        {title}
      </h3>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} prefetch={false} className="transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
