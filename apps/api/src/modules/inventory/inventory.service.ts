import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AddStockBatchInput, AdjustStockInput, StockSummaryRow } from '@sweets/types';
import type { Prisma } from '../../generated/prisma/client';
import { referenceNumber } from '../../common/utils/reference-number';
import { PrismaService, type Tx } from '../../prisma/prisma.service';

const batchInclude = {
  variant: {
    select: { id: true, sku: true, label: true, product: { select: { id: true, name: true } } },
  },
  location: { select: { id: true, name: true } },
} satisfies Prisma.StockBatchInclude;

/** Batches that can still be sold right now. */
function sellable(now = new Date()): Prisma.StockBatchWhereInput {
  return { quantity: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async availableByVariant(variantIds: string[]): Promise<Map<string, number>> {
    if (!variantIds.length) return new Map();
    const rows = await this.prisma.stockBatch.groupBy({
      by: ['variantId'],
      where: { variantId: { in: variantIds }, ...sellable() },
      _sum: { quantity: true },
    });
    return new Map(rows.map((r) => [r.variantId, r._sum.quantity ?? 0]));
  }

  async summary(): Promise<StockSummaryRow[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true, product: { isActive: true } },
      select: {
        id: true,
        sku: true,
        label: true,
        lowStockThreshold: true,
        product: { select: { id: true, name: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { sortOrder: 'asc' }],
    });
    const rows = await this.prisma.stockBatch.groupBy({
      by: ['variantId'],
      where: sellable(),
      _sum: { quantity: true },
      _min: { expiresAt: true },
    });
    const byVariant = new Map(rows.map((r) => [r.variantId, r]));
    return variants.map((v) => {
      const row = byVariant.get(v.id);
      const available = row?._sum.quantity ?? 0;
      return {
        variantId: v.id,
        productId: v.product.id,
        sku: v.sku,
        productName: v.product.name,
        variantLabel: v.label,
        available,
        nextExpiry: row?._min.expiresAt?.toISOString() ?? null,
        lowStockThreshold: v.lowStockThreshold,
        isLow: available <= v.lowStockThreshold,
      };
    });
  }

  /** Sizes on sale at or below their alert level, most urgent (sold out, then biggest gap) first. */
  async lowStock(): Promise<StockSummaryRow[]> {
    return (await this.summary())
      .filter((r) => r.isLow)
      .sort(
        (a, b) =>
          a.available - a.lowStockThreshold - (b.available - b.lowStockThreshold) ||
          a.productName.localeCompare(b.productName),
      );
  }

  listBatches(q: { variantId?: string; locationId?: string }) {
    return this.prisma.stockBatch.findMany({
      where: { variantId: q.variantId, locationId: q.locationId, quantity: { gt: 0 } },
      include: batchInclude,
      orderBy: [{ expiresAt: { sort: 'asc', nulls: 'last' } }, { producedAt: 'asc' }],
      take: 200,
    });
  }

  expiringBatches(withinHours: number) {
    const now = new Date();
    return this.prisma.stockBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiresAt: { gt: now, lte: new Date(now.getTime() + withinHours * 3_600_000) },
      },
      include: batchInclude,
      orderBy: { expiresAt: 'asc' },
    });
  }

  async addBatch(input: AddStockBatchInput, userId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: { select: { shelfLifeDays: true } } },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    const producedAt = input.producedAt ?? new Date();
    const shelfLife = variant.product.shelfLifeDays;
    const expiresAt =
      input.expiresAt ??
      (shelfLife ? new Date(producedAt.getTime() + shelfLife * 86_400_000) : null);

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.create({
        data: {
          variantId: input.variantId,
          locationId: input.locationId,
          batchCode: input.batchCode ?? referenceNumber('B', producedAt),
          quantity: input.quantity,
          initialQuantity: input.quantity,
          producedAt,
          expiresAt,
          unitCost: input.unitCost,
        },
        include: batchInclude,
      });
      await tx.stockMovement.create({
        data: {
          type: input.source,
          variantId: input.variantId,
          batchId: batch.id,
          locationId: input.locationId,
          quantity: input.quantity,
          note: input.note,
          createdById: userId,
        },
      });
      return batch;
    });
  }

  async adjust(input: AdjustStockInput, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.findUnique({ where: { id: input.batchId } });
      if (!batch) throw new NotFoundException('Batch not found');
      if (batch.quantity + input.quantityDelta < 0) {
        throw new BadRequestException(`Batch only has ${batch.quantity} units`);
      }
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: { quantity: { increment: input.quantityDelta } },
      });
      await tx.stockMovement.create({
        data: {
          type: input.type,
          variantId: batch.variantId,
          batchId: batch.id,
          locationId: batch.locationId,
          quantity: input.quantityDelta,
          note: input.note,
          createdById: userId,
        },
      });
      return tx.stockBatch.findUniqueOrThrow({ where: { id: batch.id }, include: batchInclude });
    });
  }

  /**
   * Take `quantity` units of a variant from sellable batches, soonest-expiring first.
   * Must run inside the caller's transaction so a shortfall rolls back the whole order.
   */
  async allocateFifo(
    tx: Tx,
    args: {
      variantId: string;
      quantity: number;
      referenceType: string;
      referenceId: string;
      userId?: string;
    },
  ) {
    const batches = await tx.stockBatch.findMany({
      where: { variantId: args.variantId, ...sellable() },
      orderBy: [{ expiresAt: { sort: 'asc', nulls: 'last' } }, { producedAt: 'asc' }],
    });

    let remaining = args.quantity;
    for (const batch of batches) {
      if (remaining === 0) break;
      const take = Math.min(batch.quantity, remaining);
      // Conditional decrement guards against a concurrent order draining the same batch.
      const { count } = await tx.stockBatch.updateMany({
        where: { id: batch.id, quantity: { gte: take } },
        data: { quantity: { decrement: take } },
      });
      if (count === 0) continue;
      await tx.stockMovement.create({
        data: {
          type: 'SALE',
          variantId: args.variantId,
          batchId: batch.id,
          locationId: batch.locationId,
          quantity: -take,
          referenceType: args.referenceType,
          referenceId: args.referenceId,
          createdById: args.userId,
        },
      });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new ConflictException({ message: 'Insufficient stock', variantId: args.variantId });
    }
  }

  /** Reverse every SALE movement for a reference (e.g. a cancelled order) back into its batch. */
  async releaseAllocation(
    tx: Tx,
    args: { referenceType: string; referenceId: string; userId?: string },
  ) {
    const sales = await tx.stockMovement.findMany({
      where: { referenceType: args.referenceType, referenceId: args.referenceId, type: 'SALE' },
    });
    for (const sale of sales) {
      if (!sale.batchId) continue;
      await tx.stockBatch.update({
        where: { id: sale.batchId },
        data: { quantity: { increment: -sale.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          type: 'RETURN',
          variantId: sale.variantId,
          batchId: sale.batchId,
          locationId: sale.locationId,
          quantity: -sale.quantity,
          referenceType: args.referenceType,
          referenceId: args.referenceId,
          createdById: args.userId,
        },
      });
    }
  }
}
