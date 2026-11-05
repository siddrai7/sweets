import { Body, Controller, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { guestOrderSchema } from '@sweets/types';
import { Public } from '../../common/decorators/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApproveReturnDto,
  OrderQueryDto,
  PlaceOrderDto,
  RejectReturnDto,
  ReturnQueryDto,
  ReturnRequestDto,
  StaffRefundDto,
  UpdateOrderStatusDto,
} from './orders.dto';
import { InvoicesService } from './invoices.service';
import { ReturnsService } from './returns.service';
import { OrdersService } from './orders.service';

class GuestOrderDto extends createZodDto(guestOrderSchema) {}
class GuestTokenDto extends createZodDto(z.object({ token: z.string().min(20).max(100) })) {}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly invoices: InvoicesService,
    private readonly returns: ReturnsService,
  ) {}

  @Roles('CUSTOMER')
  @Post()
  place(@Body() dto: PlaceOrderDto, @CurrentUser() user: RequestUser) {
    return this.orders.place(user.id, dto);
  }

  /** Checkout without an account. Returns the order and its private link token. */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('guest')
  placeGuest(@Body() dto: GuestOrderDto) {
    return this.orders.placeGuest(dto);
  }

  /** A guest order, opened with its private link token. */
  @Public()
  @Get('guest/:number')
  getGuest(@Param('number') number: string, @Query() q: GuestTokenDto) {
    return this.orders.getGuest(number, q.token);
  }

  @Public()
  @Get('guest/:number/invoice')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
  )
  async guestInvoice(@Param('number') number: string, @Query() q: GuestTokenDto) {
    const order = await this.orders.getGuest(number, q.token);
    return this.invoices.html(order.id);
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

  /** Printable GST tax invoice (HTML). Issued on delivery. */
  @Roles('CUSTOMER', 'ADMIN', 'STAFF')
  @Get(':id/invoice')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
  )
  invoice(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.invoices.html(id, user.role === 'CUSTOMER' ? user.id : undefined);
  }

  /** Customer reports a problem with a delivered order. */
  @Roles('CUSTOMER')
  @Post(':id/returns')
  requestReturn(
    @Param('id') id: string,
    @Body() dto: ReturnRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.returns.request(id, user.id, dto);
  }

  /** Staff record a refund directly. */
  @Roles('ADMIN', 'STAFF')
  @Post(':id/refunds')
  refund(@Param('id') id: string, @Body() dto: StaffRefundDto, @CurrentUser() user: RequestUser) {
    return this.returns.staffRefund(id, user.id, dto);
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

@ApiTags('orders')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  list(@Query() q: ReturnQueryDto) {
    return this.returns.list(q);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveReturnDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.returns.approve(id, user.id, dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectReturnDto, @CurrentUser() user: RequestUser) {
    return this.returns.reject(id, user.id, dto.note);
  }
}
