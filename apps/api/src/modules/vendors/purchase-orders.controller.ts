import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PURCHASE_ORDER_STATUSES, purchaseOrderInputSchema } from '@sweets/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { PurchaseOrdersService } from './purchase-orders.service';

class PurchaseOrderDto extends createZodDto(purchaseOrderInputSchema) {}
class PoStatusDto extends createZodDto(z.object({ status: z.enum(PURCHASE_ORDER_STATUSES) })) {}

@ApiTags('purchase-orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  /** Vendors only ever see their own purchase orders. */
  @Roles('ADMIN', 'STAFF', 'VENDOR')
  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.purchaseOrders.list(user);
  }

  @Roles('ADMIN', 'STAFF', 'VENDOR')
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.purchaseOrders.get(id, user);
  }

  @Roles('ADMIN', 'STAFF')
  @Post()
  create(@Body() dto: PurchaseOrderDto) {
    return this.purchaseOrders.create(dto);
  }

  @Roles('ADMIN', 'STAFF', 'VENDOR')
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: PoStatusDto, @CurrentUser() user: RequestUser) {
    return this.purchaseOrders.setStatus(id, dto.status, user);
  }
}
