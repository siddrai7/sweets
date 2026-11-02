import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { CartProvider } from '@/lib/cart';
import { SessionProvider } from '@/lib/session';
import { site } from '@/lib/site';
import './globals.css';

const heading = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
});
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Fresh Indian Sweets Online`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { type: 'website', siteName: site.name, locale: 'en_IN' },
};

export const viewport: Viewport = { themeColor: '#8e1b1f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    foundingDate: site.established,
    telephone: site.contact.phone,
    email: site.contact.email,
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
            <CartDrawer />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
