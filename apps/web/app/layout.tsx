import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { CartToast, MobileNav } from '@/components/layout/mobile-nav';
import { CartProvider } from '@/lib/cart';
import { SessionProvider } from '@/lib/session';
import { site } from '@/lib/site';
import './globals.css';

const heading = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  style: ['normal', 'italic'],
  // Only the SOFT axis is used; WONK and opsz roughly double the font download.
  axes: ['SOFT'],
});
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Fresh Indian Sweets Online`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { type: 'website', siteName: site.name, locale: 'en_IN' },
};

export const viewport: Viewport = { themeColor: '#faf6ef' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // A local shop listing, so Google can show the shop with address and hours (e.g. on Maps).
  const organization = {
    '@context': 'https://schema.org',
    '@type': ['Bakery', 'LocalBusiness'],
    name: site.name,
    url: site.url,
    logo: `${site.url}/icons/512.png`,
    image: `${site.url}/opengraph-image`,
    foundingDate: site.established,
    telephone: site.contact.phone,
    email: site.contact.email,
    priceRange: '₹₹',
    servesCuisine: 'Indian sweets',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.street,
      addressLocality: site.contact.city,
      addressRegion: site.contact.state,
      postalCode: site.contact.postalCode,
      addressCountry: 'IN',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: site.contact.opens,
      closes: site.contact.closes,
    },
    sameAs: Object.values(site.social),
  };

  return (
    <html lang="en-IN" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
        />
        <SessionProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <MobileNav />
            <CartDrawer />
            <CartToast />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
