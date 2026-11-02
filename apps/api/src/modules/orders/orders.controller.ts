import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrderQueryDto, PlaceOrderDto, UpdateOrderStatusDto } from './orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles('CUSTOMER')
  @Post()
  place(@Body() dto: PlaceOrderDto, @CurrentUser() user: RequestUser) {
    return this.orders.place(user.id, dto);
  }

  /** Customers see their own orders; staff see everything. */
  @Roles('CUSTOMER', 'ADMIN', 'STAFF')
  @Get()
  list(@Query() q: OrderQueryDto, @CurrentUser() user: RequestUser) {
    return this.orders.list(q, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  @Roles('CUSTOMER', 'ADMIN', 'STAFF')
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.orders.get(id, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  @Roles('ADMIN', 'STAFF')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.orders.updateStatus(id, dto, user.id);
  }

  @Roles('CUSTOMER')
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.orders.cancelByCustomer(id, user.id);
  }
}
