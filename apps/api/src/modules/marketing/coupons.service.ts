import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CouponCheckInput, CouponInput, CouponUpdateInput } from '@sweets/types';
import { Prisma, type Coupon } from '../../generated/prisma/client';
import type { Env } from '../../config/env';
import { withUniqueMessages } from '../../common/utils/prisma-errors';
import { PrismaService, type Tx } from '../../prisma/prisma.service';
import { couponDiscount } from './coupon-math';

const Decimal = Prisma.Decimal;
const UNIQUE = { code: 'Another coupon already uses this code' };
const rupees = (d: Prisma.Decimal) => `₹${d.toDecimalPlaces(0, Decimal.ROUND_UP).toString()}`;

export interface AppliedCoupon {
  coupon: Coupon;
  discount: Prisma.Decimal;
  freeDelivery: boolean;
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  list() {
    return this.prisma.coupon.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] });
  }

  create(input: CouponInput) {
    return withUniqueMessages(() => this.prisma.coupon.create({ data: input }), UNIQUE);
  }

  async update(id: string, input: CouponUpdateInput) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Coupon not found');
    const merged = { ...existing, ...input };
    if (merged.type === 'PERCENT' && Number(merged.value) > 100) {
      throw new BadRequestException('A percentage can’t be more than 100');
    }
    return withUniqueMessages(
      () => this.prisma.coupon.update({ where: { id }, data: input }),
      UNIQUE,
    );
  }

  /** Checkout preview: what the code takes off this cart, or why it can't be used. */
  async check(input: CouponCheckInput, customerId?: string) {
    const quantities = new Map<string, number>();
    for (const i of input.items)
      quantities.set(i.variantId, (quantities.get(i.variantId) ?? 0) + i.quantity);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: [...quantities.keys()] }, isActive: true },
      select: { id: true, price: true },
    });
    const subtotal = variants.reduce(
      (s, v) => s.add(v.price.mul(quantities.get(v.id)!)),
      new Decimal(0),
    );
    let customer = customerId;
    if (!customer && input.email) {
      const u = await this.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
        select: { id: true },
      });
      customer = u?.id;
    }
    const applied = await this.evaluate(this.prisma, input.code, subtotal, customer);
    return {
      code: applied.coupon.code,
      description: applied.coupon.description,
      discount: applied.discount.toString(),
      freeDelivery: applied.freeDelivery,
    };
  }

  /**
   * Checks every rule for a code against an item total and customer. Throws a message the
   * customer can act on.
   */
  async evaluate(
    db: Tx | PrismaService,
    rawCode: string,
    subtotal: Prisma.Decimal,
    customerId?: string,
  ): Promise<AppliedCoupon> {
    const code = rawCode.trim().toUpperCase();
    const coupon = await db.coupon.findUnique({ where: { code } });
    const now = new Date();
    if (!coupon || !coupon.isActive) throw new BadRequestException(`“${code}” isn’t a valid code`);
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException(`${code} isn’t active yet`);
    }
    if (coupon.endsAt && coupon.endsAt < now) throw new BadRequestException(`${code} has expired`);
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException(`${code} has been fully used`);
    }
    if (subtotal.lessThan(coupon.minSubtotal)) {
      throw new BadRequestException(
        `Add ${rupees(coupon.minSubtotal.sub(subtotal))} more to use ${code}`,
      );
    }
    if (customerId && (coupon.firstOrderOnly || coupon.perCustomerLimit !== null)) {
      const live = { customerId, status: { notIn: ['CANCELLED' as const] } };
      if (coupon.firstOrderOnly && (await db.order.count({ where: live }))) {
        throw new BadRequestException(`${code} is for your first order only`);
      }
      if (
        coupon.perCustomerLimit !== null &&
        (await db.order.count({ where: { ...live, couponId: coupon.id } })) >=
          coupon.perCustomerLimit
      ) {
        throw new BadRequestException(`You’ve already used ${code}`);
      }
    }
    const freeDelivery = coupon.type === 'FREE_DELIVERY';
    const discount = couponDiscount(coupon, subtotal);
    if (!freeDelivery && discount.isZero()) {
      throw new BadRequestException(`${code} doesn’t apply to this order`);
    }
    return { coupon, discount, freeDelivery };
  }

  /** Counts a redemption; fails if the last one was taken by a concurrent order. */
  async redeem(tx: Tx, couponId: string) {
    const n = await tx.$executeRaw`
      UPDATE "Coupon" SET "usedCount" = "usedCount" + 1, "updatedAt" = now()
      WHERE id = ${couponId} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
    if (n === 0) throw new BadRequestException('That code has just been fully used');
  }

  /** A cancelled order gives its redemption back. */
  async release(tx: Tx, couponId: string) {
    await tx.coupon.updateMany({
      where: { id: couponId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }

  /** The delivery fee rule, shared with order placement. */
  deliveryFee(subtotal: Prisma.Decimal, fulfillment: string, freeDelivery: boolean) {
    if (fulfillment !== 'DELIVERY' || freeDelivery) return new Decimal(0);
    return subtotal.lessThan(this.config.get('FREE_DELIVERY_ABOVE', { infer: true }))
      ? new Decimal(this.config.get('DELIVERY_FEE', { infer: true }))
      : new Decimal(0);
  }
}
