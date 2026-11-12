import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CategoryInput,
  CategoryUpdateInput,
  ProductInput,
  ProductQuery,
  ProductSort,
  ProductUpdateInput,
} from '@sweets/types';
import type { Prisma } from '../../generated/prisma/client';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { withUniqueMessages } from '../../common/utils/prisma-errors';
import { normalizeQuery, queryTokens } from './search-normalize';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StorefrontCacheService } from './storefront-cache.service';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] },
} satisfies Prisma.ProductInclude;

const PRODUCT_UNIQUE = {
  slug: 'Another product already uses this URL slug',
  sku: 'One of these SKUs is already used by another product',
};
const CATEGORY_UNIQUE = { slug: 'Another category already uses this URL slug' };

type ProductWithVariants = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const SORTS: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: 'desc' }, { name: 'asc' }],
  'price-asc': [{ basePrice: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
  'price-desc': [{ basePrice: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }],
  'name-asc': [{ name: 'asc' }],
  'name-desc': [{ name: 'desc' }],
  newest: [{ createdAt: 'desc' }],
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly storefront: StorefrontCacheService,
  ) {}

  /** After a successful catalog write, refresh the storefront's cached pages. */
  private async changed<T>(write: Promise<T>): Promise<T> {
    const result = await write;
    this.storefront.catalogChanged();
    return result;
  }

  async listProducts(q: ProductQuery) {
    const now = new Date();
    const search = q.search?.trim() ? await this.searchIds(q.search, !q.includeInactive) : null;
    const where: Prisma.ProductWhereInput = {
      ...(!q.includeInactive
        ? { isActive: true }
        : q.isActive !== undefined && { isActive: q.isActive }),
      ...(q.featured !== undefined && { isFeatured: q.featured }),
      ...(q.tag && { tags: { has: q.tag } }),
      ...(q.exclude && { id: { not: q.exclude } }),
      ...(q.category && { categoryId: { in: await this.categoryWithDescendants(q.category) } }),
      ...((q.minPrice !== undefined || q.maxPrice !== undefined) && {
        basePrice: { gte: q.minPrice, lte: q.maxPrice },
      }),
      ...(q.inStock && {
        variants: {
          some: {
            isActive: true,
            batches: {
              some: { quantity: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            },
          },
        },
      }),
      ...(search && { id: { in: search.ids } }),
    };
    const [items, total] =
      q.sort === 'featured' && !q.includeInactive
        ? await this.pageInStockFirst(where, q)
        : await Promise.all([
            this.prisma.product.findMany({
              where,
              include: productInclude,
              orderBy: SORTS[q.sort],
              ...pageArgs(q),
            }),
            this.prisma.product.count({ where }),
          ]);
    if (search && q.log && q.page === 1) await this.logSearch(search.term, total);
    return {
      ...paginated(await this.withAvailability(items, !q.includeInactive), total, q),
      suggestion: search?.suggestion ?? null,
    };
  }

  /**
   * The storefront's default ("Recommended") order: featured first, but anything sold out for
   * today goes to the end, so a shopper never opens the shop to a row of unavailable sweets.
   * Stock lives in batches rather than a column, so the matching ids are ranked in memory
   * and only the requested page is loaded in full.
   */
  private async pageInStockFirst(
    where: Prisma.ProductWhereInput,
    q: ProductQuery,
  ): Promise<[ProductWithVariants[], number]> {
    const ranked = await this.prisma.product.findMany({
      where,
      orderBy: SORTS.featured,
      select: { id: true, variants: { where: { isActive: true }, select: { id: true } } },
    });
    const available = await this.inventory.availableByVariant(
      ranked.flatMap((p) => p.variants.map((v) => v.id)),
    );
    const inStock = (p: (typeof ranked)[number]) =>
      p.variants.some((v) => (available.get(v.id) ?? 0) > 0);
    const { skip, take } = pageArgs(q);
    const ids = [...ranked.filter(inStock), ...ranked.filter((p) => !inStock(p))]
      .slice(skip, skip + take)
      .map((p) => p.id);
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: productInclude,
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    rows.sort((x, y) => order.get(x.id)! - order.get(y.id)!);
    return [rows, ranked.length];
  }

  /**
   * Product ids matching a customer's search. Every word (after spelling normalisation) must
   * appear in the name, description, tags, other names, SKU or category. If nothing matches,
   * fall back to fuzzy name matching (pg_trgm) and suggest the closest name.
   */
  private async searchIds(raw: string, activeOnly: boolean) {
    const term = normalizeQuery(raw);
    const tokens = queryTokens(term);
    if (!tokens.length) return { term, ids: [] as string[], suggestion: null };
    const patterns = tokens.map((t) => `%${t}%`);
    const exact = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Category" parent ON parent.id = c."parentId"
      WHERE (${!activeOnly} OR p."isActive")
        AND ' ' || regexp_replace(lower(
              p.name || ' ' || coalesce(p.description, '') || ' ' ||
              coalesce(array_to_string(p.tags, ' '), '') || ' ' ||
              coalesce(array_to_string(p."searchAliases", ' '), '') || ' ' ||
              c.name || ' ' || coalesce(parent.name, '') || ' ' ||
              coalesce((SELECT string_agg(v.sku, ' ') FROM "ProductVariant" v WHERE v."productId" = p.id), '')
            ), '[^a-z0-9]+', ' ', 'g') || ' ' LIKE ALL (${patterns}::text[])`;
    if (exact.length) return { term, ids: exact.map((r) => r.id), suggestion: null };

    const fuzzy = await this.prisma.$queryRaw<{ id: string; name: string; score: number }[]>`
      SELECT p.id, p.name, GREATEST(
               word_similarity(${term}, lower(p.name)),
               similarity(${term}, lower(p.name)),
               COALESCE((SELECT max(similarity(${term}, a)) FROM unnest(coalesce(p."searchAliases", '{}')) a), 0)
             ) AS score
      FROM "Product" p
      WHERE (${!activeOnly} OR p."isActive")
      ORDER BY score DESC
      LIMIT 12`;
    const close = fuzzy.filter((r) => r.score >= 0.35);
    return {
      term,
      ids: close.map((r) => r.id),
      suggestion: close[0]?.name.toLowerCase() ?? null,
    };
  }

  private logSearch(term: string, results: number) {
    if (!term || term.length > 100) return Promise.resolve();
    return this.prisma.searchTerm
      .upsert({
        where: { term },
        create: { term, searches: 1, zeroResults: results ? 0 : 1, lastResults: results },
        update: {
          searches: { increment: 1 },
          zeroResults: results ? undefined : { increment: 1 },
          lastResults: results,
          lastSearchedAt: new Date(),
        },
      })
      .then(() => undefined)
      .catch(() => undefined);
  }

  /** What customers search for, for the ERP report. */
  searchReport(zeroOnly: boolean) {
    return this.prisma.searchTerm.findMany({
      where: zeroOnly ? { zeroResults: { gt: 0 } } : undefined,
      orderBy: zeroOnly
        ? [{ zeroResults: 'desc' }, { lastSearchedAt: 'desc' }]
        : [{ searches: 'desc' }],
      take: 100,
    });
  }

  /** A category slug resolves to itself plus every sub-category beneath it. */
  private async categoryWithDescendants(slug: string): Promise<string[]> {
    const all = await this.prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
    });
    const root = all.find((c) => c.slug === slug);
    if (!root) return [];
    const ids = [root.id];
    for (let i = 0; i < ids.length; i++) {
      for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    }
    return ids;
  }

  async getProduct(idOrSlug: string, includeInactive: boolean) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(!includeInactive && { isActive: true }),
      },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    const [withStock] = await this.withAvailability([product], !includeInactive);
    return withStock;
  }

  async createProduct({ variants, ...data }: ProductInput) {
    await this.assertCategory(data.categoryId);
    return this.changed(
      withUniqueMessages(
        () =>
          this.prisma.product.create({
            data: {
              ...data,
              basePrice: lowestPrice(variants),
              variants: { create: variants.map(({ id: _id, ...v }) => v) },
            },
            include: productInclude,
          }),
        PRODUCT_UNIQUE,
      ),
    );
  }

  /**
   * When `variants` is sent it is treated as the full list: variants are matched by id
   * (or SKU), new ones are created, and omitted ones are deactivated — never deleted,
   * because past orders reference them.
   */
  async updateProduct(id: string, { variants, ...data }: ProductUpdateInput) {
    if (data.categoryId) await this.assertCategory(data.categoryId);
    return this.changed(
      withUniqueMessages(() => this.applyProductUpdate(id, variants, data), PRODUCT_UNIQUE),
    );
  }

  private applyProductUpdate(
    id: string,
    variants: ProductUpdateInput['variants'],
    data: Omit<ProductUpdateInput, 'variants'>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id }, include: { variants: true } });
      if (!existing) throw new NotFoundException('Product not found');

      await tx.product.update({ where: { id }, data });

      if (variants) {
        const keep = new Set<string>();
        for (const { id: variantId, ...v } of variants) {
          const match = existing.variants.find((ev) => ev.id === variantId || ev.sku === v.sku);
          if (match) {
            await tx.productVariant.update({ where: { id: match.id }, data: v });
            keep.add(match.id);
          } else {
            const created = await tx.productVariant.create({ data: { ...v, productId: id } });
            keep.add(created.id);
          }
        }
        await tx.productVariant.updateMany({
          where: { productId: id, id: { notIn: [...keep] } },
          data: { isActive: false },
        });
        await tx.product.update({ where: { id }, data: { basePrice: lowestPrice(variants) } });
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    });
  }

  // ── Categories ──

  /** Customers see active categories; staff see all, with product counts. */
  async listCategories(staff: boolean) {
    const categories = await this.prisma.category.findMany({
      where: staff ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      ...(staff && { include: { _count: { select: { products: true } } } }),
    });
    return categories.map(
      ({
        _count,
        ...c
      }: (typeof categories)[number] & {
        _count?: { products: number };
      }) => (staff ? { ...c, productCount: _count?.products ?? 0 } : c),
    );
  }

  async createCategory(input: CategoryInput) {
    if (input.parentId) await this.assertParent(input.parentId);
    return this.changed(
      withUniqueMessages(() => this.prisma.category.create({ data: input }), CATEGORY_UNIQUE),
    );
  }

  async updateCategory(id: string, input: CategoryUpdateInput) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');
    if (input.parentId) {
      if (input.parentId === id)
        throw new BadRequestException('A category can’t be its own parent');
      if (existing._count.children > 0) {
        throw new BadRequestException(
          'This category has sub-categories, so it must stay top-level. Move its sub-categories first.',
        );
      }
      await this.assertParent(input.parentId);
    }
    return this.changed(
      withUniqueMessages(
        () => this.prisma.category.update({ where: { id }, data: input }),
        CATEGORY_UNIQUE,
      ),
    );
  }

  /** The storefront menus show two levels, so a parent must itself be top-level. */
  private async assertParent(parentId: string) {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });
    if (!parent) throw new BadRequestException('Parent category not found');
    if (parent.parentId) {
      throw new BadRequestException('Sub-categories can only sit under a top-level category');
    }
  }

  private async assertCategory(categoryId: string) {
    const exists = await this.prisma.category.count({ where: { id: categoryId } });
    if (!exists) throw new BadRequestException('That category does not exist');
  }

  /** Active products by id, in the order given (wishlist, recently viewed). */
  async productsByIds(ids: string[]) {
    if (!ids.length) return [];
    const items = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: productInclude,
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    items.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    return this.withAvailability(items, true);
  }

  /** Active products that sell any of these sizes ("Order again"). */
  async productsForVariants(variantIds: string[]) {
    const rows = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { productId: true },
    });
    return this.productsByIds([...new Set(rows.map((r) => r.productId))]);
  }

  /**
   * "Frequently bought together": products that most often share an order with this one,
   * topped up with bestsellers from the same category while there's little order history.
   */
  async boughtTogether(idOrSlug: string, limit = 4) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, categoryId: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const rows = await this.prisma.$queryRaw<{ productId: string }[]>`
      SELECT v2."productId", COUNT(DISTINCT oi2."orderId") AS n
      FROM "OrderItem" oi1
      JOIN "ProductVariant" v1 ON v1.id = oi1."variantId"
      JOIN "OrderItem" oi2 ON oi2."orderId" = oi1."orderId"
      JOIN "ProductVariant" v2 ON v2.id = oi2."variantId"
      JOIN "Order" o ON o.id = oi1."orderId"
      WHERE v1."productId" = ${product.id} AND v2."productId" <> ${product.id}
        AND o.status <> 'CANCELLED'
      GROUP BY v2."productId"
      ORDER BY n DESC
      LIMIT ${limit * 2}`;
    let ids = rows.map((r) => r.productId);
    if (ids.length < limit) {
      const fill = await this.prisma.product.findMany({
        where: { isActive: true, id: { notIn: [product.id, ...ids] } },
        orderBy: [{ isFeatured: 'desc' }, { ratingCount: 'desc' }, { name: 'asc' }],
        select: { id: true, categoryId: true },
        take: 40,
      });
      // Other categories first: a box of ladoos pairs better with namkeen than more ladoos.
      fill.sort(
        (a, b) =>
          Number(a.categoryId === product.categoryId) - Number(b.categoryId === product.categoryId),
      );
      ids = [...ids, ...fill.map((p) => p.id)];
    }
    const products = await this.productsByIds(ids);
    return products.filter((p) => p.variants.some((v) => v.available > 0)).slice(0, limit);
  }

  private async withAvailability(products: ProductWithVariants[], activeVariantsOnly: boolean) {
    const variantIds = products.flatMap((p) => p.variants.map((v) => v.id));
    const available = await this.inventory.availableByVariant(variantIds);
    return products.map((p) => ({
      ...p,
      variants: p.variants
        .filter((v) => !activeVariantsOnly || v.isActive)
        .map((v) => ({ ...v, available: available.get(v.id) ?? 0 })),
    }));
  }
}

function lowestPrice(variants: { price: string; isActive?: boolean }[]): string | null {
  const prices = variants.filter((v) => v.isActive !== false).map((v) => Number(v.price));
  return prices.length ? String(Math.min(...prices)) : null;
}
