import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  addStockBatchSchema,
  adjustStockSchema,
  expiringQuerySchema,
  locationInputSchema,
} from '@sweets/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from './inventory.service';

class LocationDto extends createZodDto(locationInputSchema) {}
class AddBatchDto extends createZodDto(addStockBatchSchema) {}
class AdjustStockDto extends createZodDto(adjustStockSchema) {}
class ExpiringQueryDto extends createZodDto(expiringQuerySchema) {}
class BatchQueryDto extends createZodDto(
  z.object({ variantId: z.string().optional(), locationId: z.string().optional() }),
) {}

@ApiTags('inventory')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('locations')
  locations() {
    return this.prisma.location.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles('ADMIN')
  @Post('locations')
  createLocation(@Body() dto: LocationDto) {
    return this.prisma.location.create({ data: dto });
  }

  /** Sellable stock per variant, with the soonest expiry. */
  @Get('summary')
  summary() {
    return this.inventory.summary();
  }

  @Get('batches')
  batches(@Query() q: BatchQueryDto) {
    return this.inventory.listBatches(q);
  }

  @Get('expiring')
  expiring(@Query() q: ExpiringQueryDto) {
    return this.inventory.expiringBatches(q.withinHours);
  }

  @Post('batches')
  addBatch(@Body() dto: AddBatchDto, @CurrentUser() user: RequestUser) {
    return this.inventory.addBatch(dto, user.id);
  }

  @Post('adjustments')
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: RequestUser) {
    return this.inventory.adjust(dto, user.id);
  }
}
