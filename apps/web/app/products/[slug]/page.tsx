import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@sweets/api-client';
import { ProductCarousel } from '@/components/product/product-carousel';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductPurchase } from '@/components/product/product-purchase';
import { Breadcrumbs } from '@/components/shop/breadcrumbs';
import { ShieldIcon, SunIcon, TruckIcon, VegMark } from '@/components/ui/icons';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { categoryTrail } from '@/lib/categories';
import { site } from '@/lib/site';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string) {
  try {
    return await serverApi.catalog.product(slug, CATALOG_REVALIDATE);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** Pre-render every product page at build time; new products render on first request. */
export async function generateStaticParams() {
  const products = await safe(serverApi.catalog.products({ pageSize: 100 }), null);
  return products?.items.map((p) => ({ slug: p.slug })) ?? [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  const description =
    product.metaDescription ?? product.description?.slice(0, 160) ?? site.description;
  return {
    title: product.metaTitle ?? `${product.name}: buy online`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProduct((await params).slug);
  const [categories, related] = await Promise.all([
    safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []),
    safe(
      serverApi.catalog.products(
        { category: product.category?.slug, exclude: product.id, pageSize: 8 },
        CATALOG_REVALIDATE,
      ),
      null,
    ),
  ]);
  const trail = categoryTrail(categories, product.categoryId);

  // Structured data so search engines can show price and availability in results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.images,
    sku: product.variants[0]?.sku,
    category: product.category?.name,
    brand: { '@type': 'Brand', name: site.name },
    offers: product.variants.map((v) => ({
      '@type': 'Offer',
      name: v.label,
      sku: v.sku,
      price: v.price,
      priceCurrency: site.currency,
      availability:
        (v.available ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${site.url}/products/${product.slug}`,
    })),
  };

  const details = [
    { title: 'Description', body: product.description, open: true },
    { title: 'Ingredients', body: product.ingredients },
    { title: 'Allergen information', body: product.allergens },
    {
      title: 'Shelf life & storage',
      body: [
        product.shelfLifeDays &&
          `Best consumed within ${product.shelfLifeDays} day${product.shelfLifeDays > 1 ? 's' : ''} of delivery.`,
        product.storageInstructions,
      ]
        .filter(Boolean)
        .join(' '),
    },
    {
      title: 'Delivery & returns',
      body: `Delivered fresh in tamper-proof packaging. Free delivery on orders above ₹${site.freeDeliveryAbove}. As our sweets are perishable, we can't accept returns, but if anything arrives damaged, contact us within 24 hours and we'll make it right.`,
    },
  ].filter((d) => d.body);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/shop' },
            ...trail.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })),
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery name={product.name} slug={product.slug} images={product.images} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-saffron-600">
              {product.category?.name}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-cocoa-soft">
              {product.isVeg && (
                <span className="flex items-center gap-1.5">
                  <VegMark /> Pure vegetarian
                </span>
              )}
              {product.tags.includes('bestseller') && (
                <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 font-semibold text-saffron-600">
                  Bestseller
                </span>
              )}
            </div>

            <div className="mt-8">
              <ProductPurchase product={product} />
            </div>

            <ul className="mt-8 grid grid-cols-3 gap-3 rounded-2xl bg-brand-100 p-4 text-center text-xs font-medium sm:text-sm">
              <li className="flex flex-col items-center gap-1.5">
                <SunIcon className="text-saffron-600" /> Made fresh today
              </li>
              <li className="flex flex-col items-center gap-1.5">
                <ShieldIcon className="text-saffron-600" /> Hygienically packed
              </li>
              <li className="flex flex-col items-center gap-1.5">
                <TruckIcon className="text-saffron-600" /> Same-day delivery
              </li>
            </ul>

            <div className="mt-8 divide-y divide-brand-200 border-y border-brand-200">
              {details.map((d) => (
                <details key={d.title} open={d.open} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    {d.title}
                    <span className="text-xl text-brand-600 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-cocoa-soft">{d.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProductCarousel
        title="You may also like"
        products={related?.items ?? []}
        viewAllHref={product.category ? `/shop/${product.category.slug}` : undefined}
      />
    </>
  );
}
