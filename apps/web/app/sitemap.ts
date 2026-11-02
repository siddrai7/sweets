import type { MetadataRoute } from 'next';
import { policies } from '@/content/policies';
import { safe, serverApi } from '@/lib/api';
import { site } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    safe(serverApi.catalog.products({ pageSize: 100 }), null),
    safe(serverApi.catalog.categories(), []),
  ]);
  return [
    { url: site.url, changeFrequency: 'daily', priority: 1 },
    { url: `${site.url}/shop`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c) => ({
      url: `${site.url}/shop/${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: c.parentId ? 0.7 : 0.8,
    })),
    ...(products?.items ?? []).map((p) => ({
      url: `${site.url}/products/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
    })),
    { url: `${site.url}/categories`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${site.url}/our-story`, priority: 0.5 },
    { url: `${site.url}/contact`, priority: 0.5 },
    ...Object.keys(policies).map((slug) => ({
      url: `${site.url}/policies/${slug}`,
      priority: 0.2,
    })),
  ];
}
