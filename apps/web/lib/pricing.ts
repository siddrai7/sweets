import type { Product, ProductVariant } from '@sweets/types';
import { site } from './site';
import type { CartLine } from './cart';

/** Whole-number percentage off MRP, or 0 when the variant isn't discounted. */
export function percentOff(v: Pick<ProductVariant, 'price' | 'mrp'>): number {
  if (!v.mrp) return 0;
  const mrp = Number(v.mrp);
  const price = Number(v.price);
  return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
}

/** "₹1,280/kg"-style unit price for weighed variants, so pack sizes are easy to compare. */
export function perKg(v: Pick<ProductVariant, 'price' | 'weightGrams'>): number | null {
  return v.weightGrams ? Math.round((Number(v.price) / v.weightGrams) * 1000) : null;
}

export function isAvailable(v: Pick<ProductVariant, 'available'>) {
  return (v.available ?? 0) > 0;
}

/** Cart line payload for a product variant. */
export function toCartLine(product: Product, v: ProductVariant): Omit<CartLine, 'quantity'> {
  return {
    variantId: v.id,
    productSlug: product.slug,
    productName: product.name,
    variantLabel: v.label,
    unitPrice: v.price,
    mrp: v.mrp ?? undefined,
    image: product.images[0],
    maxQuantity: v.available,
  };
}

/** Mirrors the API: a flat fee on delivery orders below the free-delivery threshold. */
export function deliveryFeeFor(subtotal: number, fulfillment: 'DELIVERY' | 'PICKUP' = 'DELIVERY') {
  if (fulfillment === 'PICKUP' || subtotal <= 0) return 0;
  return subtotal < site.freeDeliveryAbove ? site.deliveryFee : 0;
}
