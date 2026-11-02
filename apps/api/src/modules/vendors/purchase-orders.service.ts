import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PurchaseOrderInput, PurchaseOrderStatus } from '@sweets/types';
import { Prisma } from '../../generated/prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { referenceNumber } from '../../common/utils/reference-number';
import { PrismaService } from '../../prisma/prisma.service';

const include = {
  items: true,
  vendor: { select: { id: true, name: true } },
} satisfies Prisma.PurchaseOrderInclude;

/** Who may move a PO from one status to the next. */
const TRANSITIONS: Record<
  PurchaseOrderStatus,
  Partial<Record<PurchaseOrderStatus, 'staff' | 'vendor'>>
> = {
  DRAFT: { SENT: 'staff', CANCELLED: 'staff' },
  SENT: { ACKNOWLEDGED: 'vendor', CANCELLED: 'staff' },
  ACKNOWLEDGED: { RECEIVED: 'staff', CANCELLED: 'staff' },
  RECEIVED: {},
  CANCELLED: {},
};

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: RequestUser) {
    return this.prisma.purchaseOrder.findMany({
      where:
        user.role === 'VENDOR'
          ? { vendorId: user.vendorId ?? '__none__', status: { not: 'DRAFT' } }
          : {},
      include,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string, user: RequestUser) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id }, include });
    if (
      !po ||
      (user.role === 'VENDOR' && (po.vendorId !== user.vendorId || po.status === 'DRAFT'))
    ) {
      throw new NotFoundException('Purchase order not found');
    }
    return po;
  }

  create(input: PurchaseOrderInput) {
    const items = input.items.map((item) => {
      const lineTotal = new Prisma.Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2);
      return { ...item, lineTotal };
    });
    const total = items.reduce((sum, i) => sum.add(i.lineTotal), new Prisma.Decimal(0));
    return this.prisma.purchaseOrder.create({
      data: {
        poNumber: referenceNumber('PO'),
        vendorId: input.vendorId,
        expectedAt: input.expectedAt,
        notes: input.notes,
        total,
        items: { create: items },
      },
      include,
    });
  }

  async setStatus(id: string, status: PurchaseOrderStatus, user: RequestUser) {
    const po = await this.get(id, user);
    const actor = TRANSITIONS[po.status][status];
    if (!actor)
      throw new BadRequestException(`Cannot move a purchase order from ${po.status} to ${status}`);
    if ((actor === 'vendor') !== (user.role === 'VENDOR')) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.purchaseOrder.updateMany({
        where: { id, status: po.status },
        data: { status },
      });
      if (count === 0) throw new BadRequestException('Purchase order was updated by someone else');

      // Receiving goods tops up raw-material stock.
      if (status === 'RECEIVED') {
        for (const item of po.items) {
          if (!item.rawMaterialId) continue;
          await tx.rawMaterial.update({
            where: { id: item.rawMaterialId },
            data: { currentStock: { increment: item.quantity } },
          });
        }
      }
      return tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include });
    });
  }
}
