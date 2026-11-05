import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';

const MAX_WISHLIST = 100;

/** Wishlist and "notify me when it's back" requests. */
@Injectable()
export class ShopperListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async wishlist(userId: string) {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });
    return this.catalog.productsByIds(rows.map((r) => r.productId));
  }

  async wishlistIds(userId: string) {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.count({ where: { id: productId, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');
    if ((await this.prisma.wishlistItem.count({ where: { userId } })) >= MAX_WISHLIST) {
      throw new BadRequestException(`Your wishlist can hold up to ${MAX_WISHLIST} sweets`);
    }
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return this.wishlistIds(userId);
  }

  async removeFromWishlist(userId: string, productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return this.wishlistIds(userId);
  }

  async requestStockAlert(variantId: string, email: string) {
    const variant = await this.prisma.productVariant.count({
      where: { id: variantId, isActive: true, product: { isActive: true } },
    });
    if (!variant) throw new NotFoundException('That size is no longer sold');
    await this.prisma.stockAlert.upsert({
      where: { variantId_email: { variantId, email: email.toLowerCase() } },
      create: { variantId, email: email.toLowerCase() },
      update: { notifiedAt: null },
    });
    return { ok: true };
  }

  /** ERP: sizes customers are waiting for, most-wanted first. */
  async pendingStockAlerts() {
    const groups = await this.prisma.stockAlert.groupBy({
      by: ['variantId'],
      where: { notifiedAt: null },
      _count: true,
      orderBy: { _count: { variantId: 'desc' } },
    });
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: groups.map((g) => g.variantId) } },
      select: { id: true, label: true, sku: true, product: { select: { name: true } } },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));
    return groups
      .filter((g) => byId.has(g.variantId))
      .map((g) => {
        const v = byId.get(g.variantId)!;
        return {
          variantId: v.id,
          productName: v.product.name,
          label: v.label,
          sku: v.sku,
          waiting: g._count,
        };
      });
  }
}
