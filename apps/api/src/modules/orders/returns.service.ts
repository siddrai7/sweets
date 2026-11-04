import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  RETURN_WINDOW_HOURS,
  type ApproveReturnInput,
  type ReturnQuery,
  type ReturnRequestInput,
  type StaffRefundInput,
} from '@sweets/types';
import { pageArgs, paginated } from '../../common/utils/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

const Decimal = Prisma.Decimal;

export const returnInclude = {
  createdBy: { select: { name: true, role: true } },
  resolvedBy: { select: { name: true } },
} satisfies Prisma.ReturnRequestInclude;

type ReturnItems = { orderItemId: string; quantity: number }[];

/**
 * "Report a problem" and refunds. Sweets are perishable, so nothing goes back into stock:
 * approving a request records the refund. A refund that covers the whole order moves it to
 * REFUNDED through OrdersService, like every other status change.
 */
@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  /** Customer reports a problem within the return window after delivery. */
  async request(idOrNumber: string, customerId: string, input: ReturnRequestInput) {
    const order = await this.loadOrder(idOrNumber);
    if (order.customerId !== customerId) throw new NotFoundException('Order not found');
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('You can report a problem once your order has been delivered.');
    }
    const delivered = order.statusHistory.find((e) => e.status === 'DELIVERED');
    const deadline =
      (delivered?.createdAt ?? order.updatedAt).getTime() + RETURN_WINDOW_HOURS * 3_600_000;
    if (Date.now() > deadline) {
      throw new BadRequestException(
        `Problems must be reported within ${RETURN_WINDOW_HOURS} hours of delivery. Please contact us and we'll help.`,
      );
    }
    if (order.returns.some((r) => r.status === 'REQUESTED')) {
      throw new BadRequestException('We’re already looking into a problem with this order.');
    }
    const amount = this.valueOf(order, input.items);
    return this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        reason: input.reason,
        items: input.items,
        note: input.note || null,
        requestedAmount: amount,
        createdById: customerId,
      },
      include: returnInclude,
    });
  }

  /** Staff record a refund directly (e.g. the customer phoned). Approved on creation. */
  async staffRefund(orderId: string, staffId: string, input: StaffRefundInput) {
    const order = await this.loadOrder(orderId);
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Refunds can be recorded for delivered orders only.');
    }
    const items = input.items ?? [];
    if (items.length) this.valueOf(order, items);
    const amount = new Decimal(input.refundAmount);
    this.assertRefundable(order, amount);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          reason: input.reason,
          items,
          requestedAmount: amount,
          status: 'APPROVED',
          refundAmount: amount,
          refundMethod: input.refundMethod,
          resolutionNote: input.note || null,
          createdById: staffId,
          resolvedById: staffId,
          resolvedAt: new Date(),
        },
        include: returnInclude,
      });
      await this.closeIfFullyRefunded(tx, order, amount, staffId);
      return created;
    });
  }

  async approve(id: string, staffId: string, input: ApproveReturnInput) {
    const request = await this.prisma.returnRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'REQUESTED')
      throw new BadRequestException('This request is already resolved.');
    const order = await this.loadOrder(request.orderId);
    const amount = new Decimal(input.refundAmount);
    this.assertRefundable(order, amount);

    return this.prisma.$transaction(async (tx) => {
      // Guard against two people approving at once.
      const { count } = await tx.returnRequest.updateMany({
        where: { id, status: 'REQUESTED' },
        data: {
          status: 'APPROVED',
          refundAmount: amount,
          refundMethod: input.refundMethod,
          resolutionNote: input.note || null,
          resolvedById: staffId,
          resolvedAt: new Date(),
        },
      });
      if (!count) throw new BadRequestException('This request was just resolved by someone else.');
      await this.closeIfFullyRefunded(tx, order, amount, staffId);
      return tx.returnRequest.findUniqueOrThrow({ where: { id }, include: returnInclude });
    });
  }

  async reject(id: string, staffId: string, note: string) {
    const { count } = await this.prisma.returnRequest.updateMany({
      where: { id, status: 'REQUESTED' },
      data: {
        status: 'REJECTED',
        resolutionNote: note,
        resolvedById: staffId,
        resolvedAt: new Date(),
      },
    });
    if (!count) {
      const exists = await this.prisma.returnRequest.count({ where: { id } });
      throw exists
        ? new BadRequestException('This request is already resolved.')
        : new NotFoundException('Request not found');
    }
    return this.prisma.returnRequest.findUniqueOrThrow({ where: { id }, include: returnInclude });
  }

  async list(q: ReturnQuery) {
    const where: Prisma.ReturnRequestWhereInput = { status: q.status };
    const [items, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        include: {
          ...returnInclude,
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              fulfillment: true,
              customer: { select: { name: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...pageArgs(q),
      }),
      this.prisma.returnRequest.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  private async loadOrder(idOrNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
      include: {
        items: true,
        returns: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /** Value of the chosen items; rejects unknown items and quantities already claimed. */
  private valueOf(order: Awaited<ReturnType<ReturnsService['loadOrder']>>, items: ReturnItems) {
    const claimed = new Map<string, number>();
    for (const r of order.returns) {
      if (r.status === 'REJECTED') continue;
      for (const i of r.items as ReturnItems) {
        claimed.set(i.orderItemId, (claimed.get(i.orderItemId) ?? 0) + i.quantity);
      }
    }
    let total = new Decimal(0);
    for (const { orderItemId, quantity } of items) {
      const line = order.items.find((i) => i.id === orderItemId);
      if (!line) throw new BadRequestException('One of those items isn’t part of this order.');
      const left = line.quantity - (claimed.get(orderItemId) ?? 0);
      if (quantity > left) {
        throw new BadRequestException(
          left > 0
            ? `You can report up to ${left} × ${line.productName}.`
            : `${line.productName} has already been reported.`,
        );
      }
      total = total.add(line.unitPrice.mul(quantity));
    }
    return total;
  }

  private refunded(order: { returns: { status: string; refundAmount: Prisma.Decimal | null }[] }) {
    return order.returns
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum.add(r.refundAmount ?? 0), new Decimal(0));
  }

  private assertRefundable(
    order: {
      total: Prisma.Decimal;
      returns: { status: string; refundAmount: Prisma.Decimal | null }[];
    },
    amount: Prisma.Decimal,
  ) {
    const left = order.total.sub(this.refunded(order));
    if (amount.greaterThan(left)) {
      throw new BadRequestException(`Only ₹${left.toFixed(2)} of this order is left to refund.`);
    }
  }

  private async closeIfFullyRefunded(
    tx: Prisma.TransactionClient,
    order: Awaited<ReturnType<ReturnsService['loadOrder']>>,
    amount: Prisma.Decimal,
    staffId: string,
  ) {
    if (this.refunded(order).add(amount).greaterThanOrEqualTo(order.total)) {
      await this.orders.markRefunded(tx, order.id, staffId);
    }
  }
}
