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
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
          { tags: { has: q.search.toLowerCase() } },
          { category: { name: { contains: q.search, mode: 'insensitive' } } },
          { variants: { some: { sku: { contains: q.search, mode: 'insensitive' } } } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: SORTS[q.sort],
        ...pageArgs(q),
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginated(await this.withAvailability(items, !q.includeInactive), total, q);
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
