import { Injectable, NotFoundException } from '@nestjs/common';
import type { Vendor, VendorInput, VendorUpdateInput } from '@sweets/types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const OPEN_PO = ['SENT', 'ACKNOWLEDGED'] as const;

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  /** Vendors with how many people can sign in for them and how many orders are open. */
  async list(): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            users: { where: { isActive: true } },
            purchaseOrders: { where: { status: { in: [...OPEN_PO] } } },
          },
        },
      },
    });
    return vendors.map(({ _count, createdAt, updatedAt: _u, ...v }) => ({
      ...v,
      createdAt: createdAt.toISOString(),
      loginCount: _count.users,
      openPurchaseOrders: _count.purchaseOrders,
    }));
  }

  create(input: VendorInput) {
    return this.prisma.vendor.create({ data: input });
  }

  async update(id: string, input: VendorUpdateInput) {
    const existing = await this.prisma.vendor.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Vendor not found');
    const vendor = await this.prisma.vendor.update({ where: { id }, data: input });

    // A deactivated supplier's people are signed out; AuthService refuses new sign-ins.
    if (input.isActive === false) {
      const users = await this.prisma.user.findMany({
        where: { vendorId: id },
        select: { id: true },
      });
      await Promise.all(users.map((u) => this.auth.revokeAll(u.id)));
    }
    return vendor;
  }
}
