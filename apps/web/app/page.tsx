import { CategoryTiles } from '@/components/home/category-tiles';
import { DeliverySteps } from '@/components/home/delivery-steps';
import { Hero } from '@/components/home/hero';
import { PromoBanners } from '@/components/home/promo-banners';
import { Promises } from '@/components/home/promises';
import { Testimonials } from '@/components/home/testimonials';
import { ProductCarousel } from '@/components/product/product-carousel';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';

export const revalidate = 60;

export const metadata = { alternates: { canonical: '/' } };

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
      <Hero />
      <CategoryTiles categories={buildCategoryTree(categories)} />
      <PromoBanners />
      <ProductCarousel
        eyebrow="Most loved"
        title="Bestsellers"
        subtitle="The sweets our customers come back for, again and again."
        products={bestsellers}
        viewAllHref="/shop?tag=bestseller"
      />
      <ProductCarousel
        eyebrow="House favourites"
        title={
          <>
            All-time <em className="text-brand-600">favourites</em>
          </>
        }
        products={favourites}
        viewAllHref="/shop?tag=favourite"
      />
      <Promises />
      <ProductCarousel
        eyebrow="Unchanged since day one"
        title="The classics"
        subtitle="Timeless recipes, exactly as we first made them."
        products={classics}
        viewAllHref="/shop?tag=classic"
      />
      <DeliverySteps />
      <Testimonials />
    </>
  );
}
