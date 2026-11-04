import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_STATUS_TRANSITIONS,
  type OrderQuery,
  type OrderStatus,
  type PlaceOrderInput,
  type UpdateOrderStatusInput,
} from '@sweets/types';
import { Prisma } from '../../generated/prisma/client';
import type { Env } from '../../config/env';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { referenceNumber } from '../../common/utils/reference-number';
import { PrismaService, type Tx } from '../../prisma/prisma.service';
import { AccountService } from '../account/account.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';

const Decimal = Prisma.Decimal;
const STOCK_REF = 'ORDER';
const CUSTOMER_CANCELLABLE: OrderStatus[] = ['PENDING_PAYMENT', 'CONFIRMED'];

const orderInclude = {
  items: true,
  payments: { orderBy: { createdAt: 'desc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  customer: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly payments: PaymentsService,
    private readonly config: ConfigService<Env, true>,
    private readonly account: AccountService,
  ) {}

  private readonly logger = new Logger(OrdersService.name);

  /**
   * Prices are tax-inclusive (MRP-style). Stock is allocated at placement so two customers
   * can never buy the same last box; cancelling releases it.
   */
  async place(customerId: string, input: PlaceOrderInput) {
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: [...quantities.keys()] }, isActive: true, product: { isActive: true } },
      include: { product: { select: { name: true, taxRatePercent: true } } },
    });
    if (variants.length !== quantities.size) {
      throw new BadRequestException('One or more items are no longer available');
    }

    const lines = variants.map((v) => {
      const quantity = quantities.get(v.id)!;
      const lineTotal = v.price.mul(quantity);
      const rate = v.product.taxRatePercent;
      return {
        variantId: v.id,
        productName: v.product.name,
        variantLabel: v.label,
        sku: v.sku,
        unitPrice: v.price,
        quantity,
        taxRatePercent: rate,
        lineTotal,
        tax: lineTotal.mul(rate).div(rate.add(100)),
      };
    });

    const subtotal = lines.reduce((sum, l) => sum.add(l.lineTotal), new Decimal(0));
    const taxTotal = lines.reduce((sum, l) => sum.add(l.tax), new Decimal(0)).toDecimalPlaces(2);
    const deliveryFee =
      input.fulfillment === 'DELIVERY' &&
      subtotal.lessThan(this.config.get('FREE_DELIVERY_ABOVE', { infer: true }))
        ? new Decimal(this.config.get('DELIVERY_FEE', { infer: true }))
        : new Decimal(0);
    const total = subtotal.add(deliveryFee);

    const { orderId, clientPayload } = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: referenceNumber('SW'),
          customerId,
          status: 'PENDING_PAYMENT',
          fulfillment: input.fulfillment,
          channel: input.channel,
          address: input.fulfillment === 'DELIVERY' ? input.address : Prisma.DbNull,
          deliverySlotStart: input.deliverySlotStart,
          deliverySlotEnd: input.deliverySlotEnd,
          notes: input.notes,
          subtotal,
          taxTotal,
          deliveryFee,
          total,
          items: { create: lines.map(({ tax: _tax, ...line }) => line) },
          statusHistory: { create: { status: 'PENDING_PAYMENT', changedById: customerId } },
        },
      });

      for (const line of lines) {
        await this.inventory.allocateFifo(tx, {
          variantId: line.variantId,
          quantity: line.quantity,
          referenceType: STOCK_REF,
          referenceId: order.id,
          userId: customerId,
        });
      }

      // Bought items leave the customer's synced cart (on every device).
      await tx.cartItem.deleteMany({
        where: { userId: customerId, variantId: { in: lines.map((l) => l.variantId) } },
      });

      const { intent } = await this.payments.initiate(tx, order, input.paymentProvider);
      if (intent.confirmImmediately) {
        await this.transition(tx, order.id, 'CONFIRMED', customerId, 'Cash on delivery');
      }
      return { orderId: order.id, clientPayload: intent.clientPayload };
    });

    // Saving the address is a convenience; it must never fail an order that went through.
    if (input.saveAddress && input.fulfillment === 'DELIVERY' && input.address) {
      await this.account
        .createAddress(customerId, { ...input.address, isDefault: false })
        .catch((e: unknown) => this.logger.warn(`Couldn't save address: ${String(e)}`));
    }

    return { order: await this.get(orderId), payment: clientPayload };
  }

  async list(q: OrderQuery, customerId?: string) {
    const where: Prisma.OrderWhereInput = {
      customerId,
      status: q.status,
      ...(q.search && {
        OR: [
          { orderNumber: { contains: q.search, mode: 'insensitive' } },
          { customer: { name: { contains: q.search, mode: 'insensitive' } } },
          { customer: { phone: { contains: q.search } } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, customer: orderInclude.customer },
        orderBy: { createdAt: 'desc' },
        ...pageArgs(q),
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  /** By id (ERP) or order number (customer links such as /account/orders/SW-…). */
  async get(idOrNumber: string, customerId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
      include: orderInclude,
    });
    if (!order || (customerId && order.customerId !== customerId)) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput, userId: string) {
    await this.prisma.$transaction((tx) =>
      this.transition(tx, id, input.status, userId, input.note),
    );
    return this.get(id);
  }

  async cancelByCustomer(id: string, customerId: string) {
    const order = await this.get(id, customerId);
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      throw new ForbiddenException(
        'This order can no longer be cancelled online — please contact us',
      );
    }
    await this.prisma.$transaction((tx) =>
      this.transition(tx, id, 'CANCELLED', customerId, 'Cancelled by customer'),
    );
    return this.get(id);
  }

  /** The single place order status changes, so side effects can't be skipped. */
  private async transition(
    tx: Tx,
    orderId: string,
    to: OrderStatus,
    userId: string,
    note?: string,
  ) {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (!ORDER_STATUS_TRANSITIONS[order.status].includes(to)) {
      throw new BadRequestException(`Cannot move an order from ${order.status} to ${to}`);
    }

    // Guard against a concurrent transition from the same starting status.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: to },
    });
    if (count === 0)
      throw new BadRequestException('Order was updated by someone else, refresh and retry');

    await tx.orderStatusEvent.create({ data: { orderId, status: to, note, changedById: userId } });

    if (to === 'CANCELLED') {
      await this.inventory.releaseAllocation(tx, {
        referenceType: STOCK_REF,
        referenceId: orderId,
        userId,
      });
      await this.payments.failPending(tx, orderId);
    }
    if (to === 'DELIVERED') {
      await this.payments.markCodCollected(tx, orderId);
    }
  }
}
