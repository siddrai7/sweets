import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductInput, ProductQuery, ProductSort, ProductUpdateInput } from '@sweets/types';
import type { Prisma } from '../../generated/prisma/client';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] },
} satisfies Prisma.ProductInclude;

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
  ) {}

  async listProducts(q: ProductQuery) {
    const now = new Date();
    const where: Prisma.ProductWhereInput = {
      ...(!q.includeInactive && { isActive: true }),
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
    return this.prisma.product.create({
      data: {
        ...data,
        basePrice: lowestPrice(variants),
        variants: { create: variants.map(({ id: _id, ...v }) => v) },
      },
      include: productInclude,
    });
  }

  /**
   * When `variants` is sent it is treated as the full list: variants are matched by id
   * (or SKU), new ones are created, and omitted ones are deactivated — never deleted,
   * because past orders reference them.
   */
  async updateProduct(id: string, { variants, ...data }: ProductUpdateInput) {
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
