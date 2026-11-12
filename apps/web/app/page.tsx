import type { Product } from '@sweets/types';
import { CategoryTiles } from '@/components/home/category-tiles';
import { DeliverySteps } from '@/components/home/delivery-steps';
import { Hero } from '@/components/home/hero';
import { PromoBanners } from '@/components/home/promo-banners';
import { Promises } from '@/components/home/promises';
import { ProductCarousel } from '@/components/product/product-carousel';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { CATALOG_REVALIDATE, safe, serverApi } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';

export const revalidate = 60;

export const metadata = { alternates: { canonical: '/' } };

const shelf = (query: { tag?: string; category?: string }) =>
  safe(serverApi.catalog.products({ ...query, pageSize: 12 }, CATALOG_REVALIDATE), null).then(
    (r) => r?.items ?? [],
  );

/** Savoury categories for the second shelf. Slugs that don't exist simply return nothing. */
const SAVOURY = ['namkeen', 'snacks'];

export default async function HomePage() {
  const [categories, bestsellers, ...savouryGroups] = await Promise.all([
    safe(serverApi.catalog.categories(CATALOG_REVALIDATE), []),
    shelf({ tag: 'bestseller' }),
    ...SAVOURY.map((category) => shelf({ category })),
  ]);
  // The API already lists what can be bought today first; keep that order across the groups.
  const savoury = savouryGroups.flat().sort((a, b) => Number(soldOut(a)) - Number(soldOut(b)));

  return (
    <>
      <Hero />
      <CategoryTiles categories={buildCategoryTree(categories)} />
      <ProductCarousel
        eyebrow="Most loved"
        title="Bestsellers"
        subtitle="What people order first, and then order again."
        products={bestsellers}
        viewAllHref="/shop?tag=bestseller"
        badges={false}
      />
      <PromoBanners />
      <ProductCarousel
        eyebrow="Tea-time"
        title={
          <>
            Snacks &amp; <em className="text-brand-600">namkeen</em>
          </>
        }
        subtitle="Crisp, savoury and made for the 4 pm chai."
        products={savoury}
        viewAllHref="/shop/namkeen"
      />
      <Promises />
      <RecentlyViewed />
      <DeliverySteps />
    </>
  );
}

const soldOut = (p: Product) => !p.variants.some((v) => (v.available ?? 0) > 0);
