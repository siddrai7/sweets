import Link from 'next/link';
import { CategoryTiles } from '@/components/home/category-tiles';
import { HeroCarousel } from '@/components/home/hero-carousel';
import { Promises } from '@/components/home/promises';
import { Testimonials } from '@/components/home/testimonials';
import { ProductCarousel } from '@/components/product/product-carousel';
import { TruckIcon } from '@/components/ui/icons';
import { heroSlides } from '@/content/home';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import { site } from '@/lib/site';

export const revalidate = 60;

const collection = (tag: string) =>
  safe(serverApi.catalog.products({ tag, pageSize: 12 }, CATALOG_REVALIDATE), null).then(
    (r) => r?.items ?? [],
  );

export default async function HomePage() {
  const [categories, bestsellers, favourites, classics] = await Promise.all([
    safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []),
    collection('bestseller'),
    collection('favourite'),
    collection('classic'),
  ]);

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <CategoryTiles categories={buildCategoryTree(categories)} />
      <ProductCarousel
        title="Bestsellers"
        subtitle="The sweets our customers come back for, again and again."
        products={bestsellers}
        viewAllHref="/shop?tag=bestseller"
      />
      <Promises />
      <ProductCarousel
        title="All-time favourites"
        products={favourites}
        viewAllHref="/shop?tag=favourite"
      />
      <ProductCarousel
        title="The classics"
        subtitle="Timeless recipes, unchanged since we opened our doors."
        products={classics}
        viewAllHref="/shop?tag=classic"
      />

      <section className="container-page py-6">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-saffron-100 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="flex items-start gap-5">
            <span className="hidden rounded-full bg-white p-4 text-saffron-600 sm:block">
              <TruckIcon size={32} />
            </span>
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Fresh to your door, the same day
              </h2>
              <p className="mt-2 text-cocoa-soft">
                Order before 2 pm for same-day delivery. Free delivery on orders above ₹
                {site.freeDeliveryAbove}.
              </p>
            </div>
          </div>
          <Link href="/shop" className="btn-primary shrink-0">
            Order now
          </Link>
        </div>
      </section>

      <Testimonials />
    </>
  );
}
