import { Controller, Get, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { DashboardStats } from '@sweets/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryService } from '../inventory/inventory.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('dashboard')
class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  @Get()
  async stats(): Promise<DashboardStats> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();
    const notCancelled = { notIn: ['CANCELLED', 'REFUNDED'] as ('CANCELLED' | 'REFUNDED')[] };

    const [today, pendingOrders, expiringBatches, lowStock] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfDay }, status: notCancelled },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PREPARING', 'READY'] } } }),
      this.prisma.stockBatch.count({
        where: {
          quantity: { gt: 0 },
          expiresAt: { gt: now, lte: new Date(now.getTime() + 48 * 3_600_000) },
        },
      }),
      this.inventory.lowStock(),
    ]);

    return {
      ordersToday: today._count,
      revenueToday: (today._sum.total ?? 0).toString(),
      pendingOrders,
      lowStockVariants: lowStock.length,
      expiringBatches,
    };
  }
}

@Module({ imports: [InventoryModule], controllers: [DashboardController] })
export class DashboardModule {}
