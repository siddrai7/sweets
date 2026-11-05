import { Prisma } from '../../generated/prisma/client';

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

export interface CouponTerms {
  type: 'PERCENT' | 'FLAT' | 'FREE_DELIVERY';
  value: Decimal;
  maxDiscount: Decimal | null;
}

/** Rupees off the (tax-inclusive) item total. Never more than the items cost. */
export function couponDiscount(c: CouponTerms, subtotal: Decimal): Decimal {
  let off = new Decimal(0);
  if (c.type === 'PERCENT') {
    off = subtotal.mul(c.value).div(100);
    if (c.maxDiscount && off.greaterThan(c.maxDiscount)) off = c.maxDiscount;
  } else if (c.type === 'FLAT') {
    off = c.value;
  }
  if (off.greaterThan(subtotal)) off = subtotal;
  return off.toDecimalPlaces(2, Decimal.ROUND_DOWN);
}

/**
 * Splits a discount across lines in proportion to their value, so each line's taxable
 * amount (and its GST) is reduced correctly. Rounding is settled on the largest line so
 * the shares add up exactly.
 */
export function allocateDiscount(discount: Decimal, lineTotals: Decimal[]): Decimal[] {
  const total = lineTotals.reduce((s, l) => s.add(l), new Decimal(0));
  if (discount.isZero() || total.isZero()) return lineTotals.map(() => new Decimal(0));
  const shares = lineTotals.map((l) =>
    discount.mul(l).div(total).toDecimalPlaces(2, Decimal.ROUND_DOWN),
  );
  const rest = discount.sub(shares.reduce((s, x) => s.add(x), new Decimal(0)));
  let largest = 0;
  lineTotals.forEach((l, i) => {
    if (l.greaterThan(lineTotals[largest]!)) largest = i;
  });
  shares[largest] = shares[largest]!.add(rest);
  return shares;
}
