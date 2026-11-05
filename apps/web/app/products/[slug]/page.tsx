import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@sweets/api-client';
import { ProductCarousel } from '@/components/product/product-carousel';
import { ProductGallery } from '@/components/product/product-gallery';
import { BoughtTogether } from '@/components/product/bought-together';
import { ProductPurchase } from '@/components/product/product-purchase';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { Reviews } from '@/components/product/reviews';
import { RatingSummary } from '@/components/product/stars';
import { WishlistButton } from '@/components/product/wishlist-button';
import { Breadcrumbs } from '@/components/shop/breadcrumbs';
import { DropIcon, LeafIcon, ShieldIcon, SunIcon, VegMark } from '@/components/ui/icons';
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
    // Real photos when there are some; otherwise the generated opengraph-image is used.
    openGraph: {
      title: product.name,
      description,
      images: product.images.length
        ? product.images.slice(0, 1)
        : [{ url: `/products/${product.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProduct((await params).slug);
  const [categories, related, reviews, together] = await Promise.all([
    safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []),
    safe(
      serverApi.catalog.products(
        { category: product.category?.slug, exclude: product.id, pageSize: 8 },
        CATALOG_REVALIDATE,
      ),
      null,
    ),
    safe(serverApi.reviews.forProduct(product.slug, 1, CATALOG_REVALIDATE), null),
    safe(serverApi.shopper.boughtTogether(product.slug, CATALOG_REVALIDATE), []),
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
    ...(reviews?.total &&
      reviews.average !== null && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: reviews.average,
          reviewCount: reviews.total,
          bestRating: 5,
          worstRating: 1,
        },
        review: reviews.items.slice(0, 5).map((r) => ({
          '@type': 'Review',
          reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
          author: { '@type': 'Person', name: r.author },
          datePublished: r.createdAt.slice(0, 10),
          name: r.title ?? undefined,
          reviewBody: r.body ?? undefined,
        })),
      }),
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
    { title: 'Ingredients', body: product.ingredients, open: true },
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
      <div className="container-page pb-6 pt-4 sm:pt-8">
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/shop' },
            ...trail.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })),
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />

        <div className="mt-5 grid gap-8 lg:mt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <ProductGallery
              name={product.name}
              slug={product.slug}
              images={product.images}
              badge={
                product.tags.includes('bestseller') ? (
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-saffron-600 shadow-card backdrop-blur">
                    ★ Bestseller
                  </span>
                ) : undefined
              }
            />
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="eyebrow">{product.category?.name}</p>
              <WishlistButton
                productId={product.id}
                name={product.name}
                size={22}
                className="-mt-2 h-11 w-11 bg-white ring-1 ring-brand-200"
              />
            </div>
            <h1 className="mt-3 text-[2.4rem] font-light leading-[1.02] tracking-[-0.01em] sm:text-6xl">
              {product.name}
            </h1>
            {!!reviews?.total && reviews.average !== null && (
              <a href="#reviews" className="mt-3 inline-flex text-sm hover:underline">
                <RatingSummary average={reviews.average} count={reviews.total} />
              </a>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              {product.isVeg && (
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-brand-200">
                  <VegMark size={12} /> Pure vegetarian
                </span>
              )}
              {product.shelfLifeDays && (
                <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-brand-200">
                  Stays fresh {product.shelfLifeDays} day{product.shelfLifeDays > 1 ? 's' : ''}
                </span>
              )}
              <span className="rounded-full bg-pista-50 px-3 py-1.5 text-pista-600 ring-1 ring-pista-100">
                Made today
              </span>
            </div>
            {product.description && (
              <p className="mt-5 max-w-xl leading-relaxed text-cocoa-soft">{product.description}</p>
            )}

            <div className="mt-8 border-t border-brand-200 pt-7">
              <ProductPurchase product={product} />
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { icon: SunIcon, label: 'Made fresh at dawn' },
                { icon: DropIcon, label: 'Pure desi ghee' },
                { icon: LeafIcon, label: 'No preservatives' },
                { icon: ShieldIcon, label: 'Hygienically packed' },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-brand-100/70 px-2 py-4 text-center text-xs font-semibold"
                >
                  <Icon size={20} className="text-saffron-600" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-8 divide-y divide-brand-200 border-y border-brand-200">
              {details.map((d) => (
                <details key={d.title} open={d.open} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-lg">
                    {d.title}
                    <span className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-brand-300 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-[0.95rem] leading-relaxed text-cocoa-soft">{d.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BoughtTogether product={product} others={together} />

      <Reviews productId={product.id} slug={product.slug} name={product.name} reviews={reviews} />

      <ProductCarousel
        eyebrow="Pairs well with"
        title="You may also like"
        products={related?.items ?? []}
        viewAllHref={product.category ? `/shop/${product.category.slug}` : undefined}
      />
      <RecentlyViewed current={product.id} />
    </>
  );
}
