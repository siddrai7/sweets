import { describe, expect, it } from 'vitest';
import { Prisma } from '../../generated/prisma/client';
import { allocateDiscount, couponDiscount } from './coupon-math';

const D = (n: number | string) => new Prisma.Decimal(n);

describe('couponDiscount', () => {
  it('takes a percentage off, capped', () => {
    expect(
      couponDiscount({ type: 'PERCENT', value: D(10), maxDiscount: null }, D(999)).toString(),
    ).toBe('99.9');
    expect(
      couponDiscount({ type: 'PERCENT', value: D(20), maxDiscount: D(150) }, D(1000)).toString(),
    ).toBe('150');
  });
  it('never exceeds the item total', () => {
    expect(
      couponDiscount({ type: 'FLAT', value: D(500), maxDiscount: null }, D(320)).toString(),
    ).toBe('320');
  });
  it('free delivery takes nothing off items', () => {
    expect(
      couponDiscount({ type: 'FREE_DELIVERY', value: D(0), maxDiscount: null }, D(320)).toString(),
    ).toBe('0');
  });
});

describe('allocateDiscount', () => {
  it('splits proportionally and adds up exactly', () => {
    const shares = allocateDiscount(D(100), [D(320), D(180), D(99)]);
    expect(shares.reduce((s, x) => s.add(x), D(0)).toString()).toBe('100');
    expect(shares[0]!.toNumber()).toBeGreaterThan(shares[1]!.toNumber());
  });
  it('is zero for no discount', () => {
    expect(allocateDiscount(D(0), [D(10)]).map(String)).toEqual(['0']);
  });
});
